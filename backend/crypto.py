import json
import base64
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from backend.config import PRIVATE_KEY_PATH, PUBLIC_KEY_PATH

def init_keys():
    """Generates or loads the institute's Ed25519 asymmetric key pair."""
    if not PRIVATE_KEY_PATH.exists() or not PUBLIC_KEY_PATH.exists():
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()

        # Save private key (PEM format)
        with open(PRIVATE_KEY_PATH, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))

        # Save public key (PEM format)
        with open(PUBLIC_KEY_PATH, "wb") as f:
            f.write(public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        print("Generated new Ed25519 keypair for Sahakar Setu.")

def get_private_key() -> ed25519.Ed25519PrivateKey:
    init_keys()
    with open(PRIVATE_KEY_PATH, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)

def get_public_key() -> ed25519.Ed25519PublicKey:
    init_keys()
    with open(PUBLIC_KEY_PATH, "rb") as f:
        return serialization.load_pem_public_key(f.read())

def get_public_key_pem() -> str:
    init_keys()
    with open(PUBLIC_KEY_PATH, "r", encoding="utf-8") as f:
        return f.read()

def canonical_payload_bytes(payload: dict) -> bytes:
    """Sort keys and produce canonical JSON bytes for deterministic cryptographic signature."""
    return json.dumps(payload, sort_keys=True, separators=(',', ':')).encode("utf-8")

def sign_credential(payload: dict) -> str:
    """Sign payload using Ed25519 private key, return base64 URL-safe signature."""
    private_key = get_private_key()
    data_bytes = canonical_payload_bytes(payload)
    raw_signature = private_key.sign(data_bytes)
    return base64.urlsafe_b64encode(raw_signature).decode("utf-8")

def verify_credential(payload: dict, signature_b64: str, public_key_pem: str = None) -> bool:
    """Verify Ed25519 digital signature against canonical payload without internet dependency."""
    try:
        if public_key_pem:
            pub_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
        else:
            pub_key = get_public_key()

        sig_bytes = base64.urlsafe_b64decode(signature_b64.encode("utf-8"))
        data_bytes = canonical_payload_bytes(payload)
        pub_key.verify(sig_bytes, data_bytes)
        return True
    except Exception as e:
        return False
