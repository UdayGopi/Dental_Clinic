"""
Redis caching layer for improved performance and scalability
"""
import json
import logging
from typing import Optional, Any
from app.config import config

logger = logging.getLogger(__name__)

# Try to import Redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("redis not installed. Caching disabled. Install with: pip install redis")

class CacheService:
    """Redis-based caching service"""
    
    def __init__(self):
        self.client = None
        self.enabled = config.ENABLE_CACHING and REDIS_AVAILABLE
        
        if self.enabled:
            try:
                self.client = redis.from_url(
                    config.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
                # Test connection
                self.client.ping()
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {str(e)}. Caching disabled.")
                self.enabled = False
                self.client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        if not self.enabled or not self.client:
            return False
        
        try:
            ttl = ttl or config.REDIS_CACHE_TTL
            serialized = json.dumps(value)
            self.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.enabled or not self.client:
            return 0
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error: {str(e)}")
            return 0
    
    def clear_patient_cache(self, patient_id: int):
        """Clear all cache entries for a patient"""
        patterns = [
            f"patient:{patient_id}:*",
            f"patient_appointments:{patient_id}:*",
            f"patient_messages:{patient_id}:*"
        ]
        for pattern in patterns:
            self.delete_pattern(pattern)
    
    def clear_all_cache(self):
        """Clear all cache (use with caution)"""
        if not self.enabled or not self.client:
            return
        
        try:
            self.client.flushdb()
            logger.info("Cache cleared")
        except Exception as e:
            logger.error(f"Cache clear error: {str(e)}")

# Create singleton instance
cache_service = CacheService()

