class AuthorizationContext:

    def __init__(
        self,
        user_id: str,
        client_id: str,
    ):
        self.user_id = user_id
        self.client_id = client_id