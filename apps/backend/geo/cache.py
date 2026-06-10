from django.core.cache import cache

GEO_CACHE_VERSION_KEY = "geo:cache_version"
GEO_CACHE_TTL_SECONDS = 60 * 60 * 24


def get_geo_cache_version() -> int:
    version = cache.get(GEO_CACHE_VERSION_KEY)
    if version is None:
        cache.set(GEO_CACHE_VERSION_KEY, 1, timeout=None)
        return 1
    return int(version)


def build_geo_cache_key(resource: str, **params: int) -> str:
    version = get_geo_cache_version()
    param_suffix = ":".join(f"{key}={value}" for key, value in sorted(params.items()))
    if param_suffix:
        return f"geo:v{version}:{resource}:{param_suffix}"
    return f"geo:v{version}:{resource}"


def bump_geo_cache_version() -> None:
    version = get_geo_cache_version()
    cache.set(GEO_CACHE_VERSION_KEY, version + 1, timeout=None)
