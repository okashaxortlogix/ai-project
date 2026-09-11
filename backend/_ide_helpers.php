<?php

/**
 * IDE Helper Stubs for Laravel 11 Framework
 * Provides symbol and type definitions for IDE language servers (Intelephense, PHP Tools, etc.)
 * when vendor directory is not installed or when developing in containerless environments.
 */

namespace {
    if (!function_exists('env')) {
        function env(string $key, mixed $default = null): mixed {
            return $_ENV[$key] ?? $default;
        }
    }

    if (!function_exists('config')) {
        function config(string|array|null $key = null, mixed $default = null): mixed {
            return $default;
        }
    }

    if (!function_exists('response')) {
        function response(mixed $content = '', int $status = 200, array $headers = []): \Illuminate\Http\JsonResponse|\Illuminate\Http\Response {
            return new \Illuminate\Http\JsonResponse($content, $status, $headers);
        }
    }

    if (!function_exists('app')) {
        function app(string|null $abstract = null, array $parameters = []): mixed {
            return null;
        }
    }
}

namespace Illuminate\Http {
    class Request {
        public function only(array|mixed $keys): array { return []; }
        public function all(): array { return []; }
        public function validate(array $rules, array $messages = []): array { return []; }
        public function header(string $key, ?string $default = null): ?string { return null; }
        public function getContent(): string { return ''; }
        public function json(): self { return $this; }
    }

    class Response {
        public function header(string $key, string $value): self { return $this; }
    }

    class JsonResponse extends Response {
        public function __construct(mixed $data = null, int $status = 200, array $headers = [], int $options = 0) {}
        public function json(mixed $data = [], int $status = 200, array $headers = [], int $options = 0): self { return $this; }
    }
}

namespace Illuminate\Support\Facades {
    class Route {
        public static function prefix(string $prefix): self { return new self; }
        public static function group(\Closure|array $callback): void {}
        public static function middleware(array|string $middleware): self { return new self; }
        public static function get(string $uri, array|string|callable|null $action = null): self { return new self; }
        public static function post(string $uri, array|string|callable|null $action = null): self { return new self; }
        public static function patch(string $uri, array|string|callable|null $action = null): self { return new self; }
        public static function put(string $uri, array|string|callable|null $action = null): self { return new self; }
        public static function delete(string $uri, array|string|callable|null $action = null): self { return new self; }
    }

    class Log {
        public static function info(string $message, array $context = []): void {}
        public static function warning(string $message, array $context = []): void {}
        public static function error(string $message, array $context = []): void {}
        public static function debug(string $message, array $context = []): void {}
    }

    class Http {
        public static function timeout(int $seconds): self { return new self; }
        public static function withHeaders(array $headers): self { return new self; }
        public static function withBasicAuth(string $username, string $password): self { return new self; }
        public static function withoutVerifying(): self { return new self; }
        public function withoutVerifying(): self { return $this; }
        public function timeout(int $seconds): self { return $this; }
        public function withHeaders(array $headers): self { return $this; }
        public function withBasicAuth(string $username, string $password): self { return $this; }
        public function get(string $url, array|string|null $query = null): \Illuminate\Http\Client\Response { return new \Illuminate\Http\Client\Response; }
        public function post(string $url, array $data = []): \Illuminate\Http\Client\Response { return new \Illuminate\Http\Client\Response; }
        public function put(string $url, array $data = []): \Illuminate\Http\Client\Response { return new \Illuminate\Http\Client\Response; }
        public function delete(string $url, array $data = []): \Illuminate\Http\Client\Response { return new \Illuminate\Http\Client\Response; }
        public function send(string $method, string $url, array $options = []): \Illuminate\Http\Client\Response { return new \Illuminate\Http\Client\Response; }
    }
}

namespace Illuminate\Http\Client {
    class Response {
        public function status(): int { return 200; }
        public function successful(): bool { return true; }
        public function ok(): bool { return true; }
        public function body(): string { return ''; }
        public function json(?string $key = null, mixed $default = null): mixed { return []; }
    }
}

namespace Illuminate\Foundation {
    class Application {
        public static function configure(?string $basePath = null): self { return new self; }
        public function withRouting(?string $web = null, ?string $api = null, ?string $commands = null, ?string $health = null): self { return $this; }
        public function withMiddleware(callable $callback): self { return $this; }
        public function withExceptions(callable $callback): self { return $this; }
        public function create(): self { return $this; }
    }
}

namespace Illuminate\Foundation\Configuration {
    class Middleware {
        public function validateCsrfTokens(array $except = []): self { return $this; }
    }
    class Exceptions {}
}

namespace Illuminate\Foundation\Http\Middleware {
    class VerifyCsrfToken {
        protected array $except = [];
    }
}

namespace Illuminate\Database\Eloquent\Relations {
    class BelongsTo {}
    class HasMany {}
    class HasOne {}
}

namespace Illuminate\Contracts\Auth {
    interface Authenticatable {}
}

namespace Illuminate\Contracts\Auth\Access {
    interface Authorizable {}
}

namespace Illuminate\Database\Eloquent {
    class Model {
        public function belongsTo(string $related, ?string $foreignKey = null, ?string $ownerKey = null, ?string $relation = null): \Illuminate\Database\Eloquent\Relations\BelongsTo|mixed { return new \Illuminate\Database\Eloquent\Relations\BelongsTo; }
        public function hasMany(string $related, ?string $foreignKey = null, ?string $localKey = null): \Illuminate\Database\Eloquent\Relations\HasMany|mixed { return new \Illuminate\Database\Eloquent\Relations\HasMany; }
        public function hasOne(string $related, ?string $foreignKey = null, ?string $localKey = null): \Illuminate\Database\Eloquent\Relations\HasOne|mixed { return new \Illuminate\Database\Eloquent\Relations\HasOne; }
        public static function find(mixed $id): ?static { return null; }
        public static function create(array $attributes = []): static { return new static; }
        public static function where(string $column, mixed $operator = null, mixed $value = null): mixed { return null; }
    }
}

namespace Illuminate\Foundation\Auth {
    class User extends \Illuminate\Database\Eloquent\Model implements 
        \Illuminate\Contracts\Auth\Authenticatable,
        \Illuminate\Contracts\Auth\Access\Authorizable {
        use \Laravel\Sanctum\HasApiTokens, \Illuminate\Database\Eloquent\Factories\HasFactory, \Illuminate\Notifications\Notifiable;
    }
}

namespace Laravel\Sanctum {
    trait HasApiTokens {}
}

namespace Illuminate\Database\Eloquent\Factories {
    trait HasFactory {}
}

namespace Illuminate\Notifications {
    trait Notifiable {}
}
