import json
from collections.abc import Awaitable
from collections.abc import Callable

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response
from starlette.responses import StreamingResponse


def add_trim_whitespace_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def trim_whitespace_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        def trim_whitespace(data):
            if isinstance(data, dict):
                return {key: trim_whitespace(value) for key, value in data.items()}
            elif isinstance(data, list):
                return [trim_whitespace(item) for item in data]
            elif isinstance(data, str):
                return data.strip()
            else:
                return data

        if (
            request.method in {"PUT", "PATCH", "POST"}
            and request.headers.get("content-type") == "application/json"
        ):
            body = await request.body()
            if body:
                json_body = json.loads(body)
                trimmed_body = trim_whitespace(json_body)
                request._body = json.dumps(trimmed_body).encode("utf-8")

        response = await call_next(request)

        if isinstance(response, StreamingResponse):
            try:
                del response.headers["Content-Length"]
            except KeyError:
                pass
            return response

        if response.headers.get("content-type") == "application/json":
            response_body = b"".join([chunk async for chunk in response.body_iterator])
            if response_body:
                json_body = json.loads(response_body)
                trimmed_body = trim_whitespace(json_body)
                response = Response(
                    content=json.dumps(trimmed_body),
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type="application/json",
                )
        return response
