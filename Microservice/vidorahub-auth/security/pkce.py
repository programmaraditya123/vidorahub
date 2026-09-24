import base64
import hashlib
import hmac

def create_code_challenge(
        code_verifier : str
) -> str:
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def verify_code_verifier(
    code_verifier: str,
    code_challenge: str,
) -> bool:

    expected = create_code_challenge(
        code_verifier
    )

    return hmac.compare_digest(
        expected,
        code_challenge,
    )