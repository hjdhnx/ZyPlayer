import argparse
import asyncio
import builtins
from functools import lru_cache
import importlib.util
import inspect
import json
import signal
import sys
from typing import Any, Dict, List, Optional
import zmq

signal.signal(signal.SIGINT, lambda signum, frame: sys.exit(130))
builtins.original_print = builtins.print


def custom_print(*args: Any, **kwargs: Any) -> None:
    try:
        log: Dict[str, Any] = {
            "type": "multiple" if len(args) > 0 else "single",
            "msg": [*args, *[f'{k}={v}' for k, v in kwargs.items()]]
        }
        builtins.original_print(log)  # type: ignore[attr-defined]
        log_socket.send_string(json.dumps(log, ensure_ascii=False))
    except zmq.ZMQError:
        pass


def ensure_json_str(val: Any) -> str:
    if isinstance(val, str):
        return val
    try:
        return json.dumps(val)
    except (TypeError, ValueError):
        return val


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Spider ZMQ server")
    parser.add_argument("--ctrl-port", type=int, default=19979, help="Control port")
    parser.add_argument("--log-port", type=int, help="Log port (default=ctrl_port+1)")
    return parser.parse_args()


def load_module_from_code(module_name: str, source_code: str) -> Any:
    spec = importlib.util.spec_from_loader(module_name, loader=None)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    exec(source_code, module.__dict__)
    return module


def sync_wrapper(func: Any, params: Optional[List[Any]]) -> Any:
    if params is None or not params:
        if inspect.iscoroutinefunction(func):
            return asyncio.run(func())
        return func()
    if inspect.iscoroutinefunction(func):
        return asyncio.run(func(*params))
    return func(*params)


@lru_cache(maxsize=10)
def get_spider(code_hash: int, code_str: str) -> Any:
    module_name = f"dynamic_module_{code_hash}"
    module = load_module_from_code(module_name, code_str)

    spider_cls = getattr(module, "Spider", None)
    if spider_cls is None:
        raise ImportError("Spider class not found in module")

    spider = spider_cls(t4_api="http://127.0.0.1:9978/proxy?do=py")
    return spider


def core(method: str, source_code: str, opts: List[Any]) -> Any:
    # print(f"Received request: method={method}, options={opts}")

    if not source_code:
        raise RuntimeError(f"Source content is empty")

    uuid = hash(source_code)
    spider = get_spider(uuid, source_code)

    method_obj = getattr(spider, method, None)
    if not method_obj:
        raise RuntimeError(f"Method '{method}' not found in Spider class")

    try:
        return sync_wrapper(method_obj, opts)
    except Exception as exc:
        raise RuntimeError(f"Failed to execute method '{method}': {exc}") from exc


if __name__ == '__main__':
    cli_args = parse_args()
    CTRL_PORT = cli_args.ctrl_port
    LOG_PORT = cli_args.log_port or (CTRL_PORT + 1)

    try:
        context = zmq.Context()

        log_socket = context.socket(zmq.PUB)
        log_socket.bind(f"tcp://*:{LOG_PORT}")

        builtins.print = custom_print

        ctrl_socket = context.socket(zmq.REP)
        ctrl_socket.bind(f"tcp://*:{CTRL_PORT}")

        sys.stdout.write(f"Spider ZMQ server started. CTRL_PORT={CTRL_PORT}, LOG_PORT={LOG_PORT}\n")
        sys.stdout.flush()

        while True:
            try:
                message: str = ctrl_socket.recv_string()
                request: Dict[str, Any] = json.loads(message)

                code: str = request.get("code", "")
                method_name: str = request.get("type", "")
                options: List[Any] = request.get("options", [])

                if method_name == "init":
                    if not options:
                        options = ['']
                    options = [ensure_json_str(options[0])]

                res: Any = core(method_name, code, options)
                ctrl_socket.send_string(json.dumps(res, ensure_ascii=False))

            except Exception as e:
                log_socket.send_string(
                    json.dumps({"type": "single", "msg": [f"Failed to execute, cause: {str(e) or 'Unknown error'}"]},
                               ensure_ascii=False))
                ctrl_socket.send_string(json.dumps({"error": f"{str(e) or 'Unknown error'}"}, ensure_ascii=False))

    except SystemExit:
        sys.stdout.write("Spider ZMQ server exited")
        sys.stdout.flush()
        sys.exit(130)

    except Exception as main_e:
        sys.stdout.write(f"Spider exited: {str(main_e)}")
        sys.stdout.flush()
        sys.exit(1)
