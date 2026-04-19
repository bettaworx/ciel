"""
Split the monolithic packages/api/openapi.yml into multi-file structure.

Strategy:
- Load the full spec.
- For each path item: decide target file via PATH_TO_FILE map and emit it.
- For each schema: decide target file via SCHEMA_TO_FILE map and emit it.
- Rewrite internal $ref ('#/components/schemas/X') to relative external ref
  (e.g. '../schemas/common.yml#/Error') inside path files.
- Rewrite schema->schema refs inside schema files similarly.
- Rebuild entry openapi.yml with: info, servers, tags, components.securitySchemes,
  and paths as a table of $ref to each path file fragment.
"""

import os
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "packages" / "api"
SRC = API_DIR / "openapi.yml"


# ------- Path grouping -------
# key = exact OpenAPI path; value = target file path relative to packages/api/
PATH_TO_FILE = {
    # system / server
    "/health": "paths/system.yml",
    "/server/info": "paths/server.yml",
    "/server/config": "paths/server.yml",

    # auth
    "/auth/register": "paths/auth.yml",
    "/auth/login/start": "paths/auth.yml",
    "/auth/login/finish": "paths/auth.yml",
    "/auth/stepup/start": "paths/auth.yml",
    "/auth/stepup/finish": "paths/auth.yml",
    "/auth/logout": "paths/auth.yml",
    "/auth/refresh": "paths/auth.yml",
    "/auth/password/change": "paths/auth.yml",

    # setup
    "/setup/status": "paths/setup.yml",
    "/setup/verify-password": "paths/setup.yml",
    "/setup/create-admin": "paths/setup.yml",
    "/setup/complete": "paths/setup.yml",
    "/setup/create-invite": "paths/setup.yml",

    # current user / public user
    "/me": "paths/users.yml",
    "/me/username": "paths/users.yml",
    "/me/profile": "paths/users.yml",
    "/me/avatar": "paths/users.yml",
    "/me/banner": "paths/users.yml",
    "/me/agreements": "paths/users.yml",
    "/users/{username}": "paths/users.yml",
    "/users/{username}/posts": "paths/users.yml",

    # posts / media / timeline / reactions
    "/posts": "paths/posts.yml",
    "/posts/{postId}": "paths/posts.yml",
    "/media": "paths/media.yml",
    "/timeline": "paths/timeline.yml",
    "/posts/{postId}/reactions": "paths/reactions.yml",
    "/posts/{postId}/reactions/users": "paths/reactions.yml",

    # reports (user-facing)
    "/reports": "paths/reports.yml",

    # agreements (public)
    "/agreements/{type}/{version}": "paths/agreements.yml",
    "/agreements/{type}/latest": "paths/agreements.yml",
    "/agreements/current": "paths/agreements.yml",

    # admin
    "/admin/dashboard/stats": "paths/admin/dashboard.yml",

    "/admin/users": "paths/admin/users.yml",
    "/admin/users/{userId}/stats": "paths/admin/users.yml",
    "/admin/users/{userId}/avatar": "paths/admin/users.yml",
    "/admin/users/{userId}/display-name": "paths/admin/users.yml",
    "/admin/users/{userId}/bio": "paths/admin/users.yml",
    "/admin/users/{userId}/ban": "paths/admin/users.yml",
    "/admin/users/{userId}/roles": "paths/admin/users.yml",
    "/admin/users/{userId}/permissions": "paths/admin/users.yml",

    "/admin/posts": "paths/admin/posts.yml",
    "/admin/posts/{postId}": "paths/admin/posts.yml",
    "/admin/posts/{postId}/visibility": "paths/admin/posts.yml",

    "/admin/media": "paths/admin/media.yml",
    "/admin/media/{mediaId}": "paths/admin/media.yml",

    "/admin/agreements/documents": "paths/admin/agreements.yml",
    "/admin/agreements/documents/{documentId}": "paths/admin/agreements.yml",
    "/admin/agreements/documents/{documentId}/publish": "paths/admin/agreements.yml",
    "/admin/agreements/documents/{documentId}/duplicate": "paths/admin/agreements.yml",
    "/admin/agreements/documents/history": "paths/admin/agreements.yml",

    # moderation family
    "/admin/users/{userId}/mutes": "paths/admin/moderation.yml",
    "/admin/users/{userId}/mutes/{muteType}": "paths/admin/moderation.yml",
    "/admin/banned-words": "paths/admin/moderation.yml",
    "/admin/banned-words/{wordId}": "paths/admin/moderation.yml",
    "/admin/banned-images": "paths/admin/moderation.yml",
    "/admin/banned-images/{hashId}": "paths/admin/moderation.yml",
    "/admin/ip-bans": "paths/admin/moderation.yml",
    "/admin/ip-bans/{banId}": "paths/admin/moderation.yml",
    "/admin/moderation-logs": "paths/admin/moderation.yml",
    "/admin/users/{userId}/moderation-logs": "paths/admin/moderation.yml",
    "/admin/users/{userId}/note": "paths/admin/moderation.yml",

    "/admin/reports": "paths/admin/reports.yml",
    "/admin/reports/{reportId}": "paths/admin/reports.yml",

    "/admin/roles": "paths/admin/roles.yml",
    "/admin/roles/{roleId}": "paths/admin/roles.yml",
    "/admin/roles/{roleId}/permissions": "paths/admin/roles.yml",
    "/admin/roles/{roleId}/users": "paths/admin/roles.yml",
    "/admin/permissions": "paths/admin/roles.yml",

    "/admin/settings": "paths/admin/settings.yml",
    "/admin/settings/signup": "paths/admin/settings.yml",
    "/admin/settings/agreements": "paths/admin/settings.yml",

    "/admin/invites": "paths/admin/invites.yml",
    "/admin/invites/{inviteId}": "paths/admin/invites.yml",
    "/admin/invites/{inviteId}/disable": "paths/admin/invites.yml",
    "/admin/invites/{inviteId}/uses": "paths/admin/invites.yml",
}


# ------- Schema grouping -------
SCHEMA_TO_FILE = {
    # common primitives / errors / ids
    "Error": "schemas/common.yml",
    "Username": "schemas/common.yml",
    "Emoji": "schemas/common.yml",
    "PostId": "schemas/common.yml",
    "MediaId": "schemas/common.yml",
    "UserId": "schemas/common.yml",
    "RoleId": "schemas/common.yml",
    "PermissionId": "schemas/common.yml",

    # enums
    "MediaType": "schemas/enums.yml",
    "PostMediaFilter": "schemas/enums.yml",
    "MuteType": "schemas/enums.yml",
    "ReportStatus": "schemas/enums.yml",
    "ReportTargetType": "schemas/enums.yml",
    "BannedWordAppliesTo": "schemas/enums.yml",
    "BannedWordSeverity": "schemas/enums.yml",
    "ImageHashType": "schemas/enums.yml",
    "PostVisibility": "schemas/enums.yml",
    "ModerationAction": "schemas/enums.yml",
    "ModerationTargetType": "schemas/enums.yml",
    "AgreementType": "schemas/enums.yml",
    "AgreementLanguage": "schemas/enums.yml",
    "AgreementDocumentStatus": "schemas/enums.yml",
    "PermissionEffect": "schemas/enums.yml",
    "PermissionScope": "schemas/enums.yml",

    # auth
    "RegisterRequest": "schemas/auth.yml",
    "LoginStartRequest": "schemas/auth.yml",
    "LoginStartResponse": "schemas/auth.yml",
    "LoginFinishRequest": "schemas/auth.yml",
    "LoginFinishResponse": "schemas/auth.yml",
    "RefreshResponse": "schemas/auth.yml",
    "StepupStartRequest": "schemas/auth.yml",
    "StepupStartResponse": "schemas/auth.yml",
    "StepupFinishRequest": "schemas/auth.yml",
    "StepupFinishResponse": "schemas/auth.yml",
    "PasswordChangeRequest": "schemas/auth.yml",

    # setup
    "SetupStatusResponse": "schemas/setup.yml",
    "VerifySetupPasswordRequest": "schemas/setup.yml",
    "VerifySetupPasswordResponse": "schemas/setup.yml",
    "CreateAdminRequest": "schemas/setup.yml",
    "CreateAdminResponse": "schemas/setup.yml",
    "ServerSetupRequest": "schemas/setup.yml",
    "ServerSetupResponse": "schemas/setup.yml",

    # user
    "User": "schemas/user.yml",
    "UpdateProfileRequest": "schemas/user.yml",
    "UpdateUsernameRequest": "schemas/user.yml",

    # posts / timeline
    "Post": "schemas/post.yml",
    "CreatePostRequest": "schemas/post.yml",
    "TimelinePage": "schemas/post.yml",
    "UserPostsPage": "schemas/post.yml",

    # media
    "Media": "schemas/media.yml",
    "MediaLimits": "schemas/media.yml",
    "MediaPostLimits": "schemas/media.yml",
    "MediaAvatarLimits": "schemas/media.yml",
    "MediaBannerLimits": "schemas/media.yml",
    "MediaServerIconLimits": "schemas/media.yml",
    "MediaVideoLimits": "schemas/media.yml",

    # server
    "ServerInfo": "schemas/server.yml",
    "ServerStats": "schemas/server.yml",
    "ServerConfig": "schemas/server.yml",
    "ServerSettings": "schemas/server.yml",
    "UpdateSignupEnabledRequest": "schemas/server.yml",

    # reactions
    "ReactionCount": "schemas/reactions.yml",
    "ReactionCounts": "schemas/reactions.yml",
    "ReactionUsersPage": "schemas/reactions.yml",
    "ReactRequest": "schemas/reactions.yml",

    # reports
    "Report": "schemas/reports.yml",
    "ReportPage": "schemas/reports.yml",
    "CreateReportRequest": "schemas/reports.yml",
    "UpdateReportRequest": "schemas/reports.yml",

    # agreements
    "AgreementVersions": "schemas/agreements.yml",
    "AcceptAgreementsRequest": "schemas/agreements.yml",
    "UpdateAgreementVersionsRequest": "schemas/agreements.yml",
    "AgreementDocument": "schemas/agreements.yml",
    "AgreementDocumentPage": "schemas/agreements.yml",
    "CreateAgreementDocumentRequest": "schemas/agreements.yml",
    "UpdateAgreementDocumentRequest": "schemas/agreements.yml",
    "PublicAgreementContent": "schemas/agreements.yml",

    # roles / permissions
    "Role": "schemas/roles.yml",
    "RoleList": "schemas/roles.yml",
    "CreateRoleRequest": "schemas/roles.yml",
    "UpdateRoleRequest": "schemas/roles.yml",
    "RolePermissions": "schemas/roles.yml",
    "RoleUser": "schemas/roles.yml",
    "RoleUsersPage": "schemas/roles.yml",
    "PermissionList": "schemas/roles.yml",
    "PermissionOverride": "schemas/roles.yml",
    "UserRolesUpdateRequest": "schemas/roles.yml",
    "UserPermissionOverrides": "schemas/roles.yml",
    "BanUserRequest": "schemas/roles.yml",

    # invites
    "InviteCode": "schemas/invites.yml",
    "InviteCodeWithCreator": "schemas/invites.yml",
    "InviteCodesListResponse": "schemas/invites.yml",
    "InviteCodeUse": "schemas/invites.yml",
    "CreateInviteCodeRequest": "schemas/invites.yml",
    "UpdateInviteCodeRequest": "schemas/invites.yml",

    # admin
    "UserStats": "schemas/admin.yml",
    "DashboardStats": "schemas/admin.yml",
    "AdminUser": "schemas/admin.yml",
    "AdminUserPage": "schemas/admin.yml",
    "AdminPost": "schemas/admin.yml",
    "AdminPostPage": "schemas/admin.yml",
    "DeletePostRequest": "schemas/admin.yml",
    "UpdatePostVisibilityRequest": "schemas/admin.yml",
    "AdminMedia": "schemas/admin.yml",
    "AdminMediaPage": "schemas/admin.yml",
    "DeleteMediaRequest": "schemas/admin.yml",
    "AdminUserNote": "schemas/admin.yml",
    "CreateAdminUserNoteRequest": "schemas/admin.yml",
    "UpdateAdminUserNoteRequest": "schemas/admin.yml",
    "ModerationLog": "schemas/admin.yml",
    "ModerationLogPage": "schemas/admin.yml",
    "UserMute": "schemas/admin.yml",
    "CreateUserMuteRequest": "schemas/admin.yml",
    "BannedWord": "schemas/admin.yml",
    "CreateBannedWordRequest": "schemas/admin.yml",
    "BannedImageHash": "schemas/admin.yml",
    "CreateBannedImageHashRequest": "schemas/admin.yml",
    "IPBan": "schemas/admin.yml",
    "IPBanPage": "schemas/admin.yml",
    "CreateIPBanRequest": "schemas/admin.yml",
}


def schema_ref_target(schema_name: str, from_dir: str) -> str:
    """Return relative ref string to reach schemas/<file>.yml#/components/schemas/<name>."""
    target_file = SCHEMA_TO_FILE[schema_name]  # e.g. "schemas/common.yml"
    from_parts = from_dir.split("/") if from_dir else []
    to_parts = target_file.split("/")
    i = 0
    while i < len(from_parts) and i < len(to_parts) - 1 and from_parts[i] == to_parts[i]:
        i += 1
    ups = [".."] * (len(from_parts) - i)
    downs = to_parts[i:]
    rel_parts = ups + downs
    rel = "/".join(rel_parts)
    if not rel.startswith(".."):
        rel = "./" + rel
    return f"{rel}#/components/schemas/{schema_name}"


def same_file_ref(schema_name: str) -> str:
    """Within a schema file, refs to siblings use the components/schemas path."""
    return f"#/components/schemas/{schema_name}"


def rewrite_refs(obj, from_dir: str, local_schemas: set | None = None):
    """
    Recursively rewrite `$ref` values.
    - from_dir: directory of the file being written (e.g. 'paths/admin', 'schemas', '').
    - local_schemas: if provided, any schema in this set stays as '#/<name>'
      (used for intra-file schema references).
    """
    if isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            if k == "$ref" and isinstance(v, str) and v.startswith("#/components/schemas/"):
                name = v[len("#/components/schemas/"):]
                if local_schemas is not None and name in local_schemas:
                    new[k] = same_file_ref(name)
                else:
                    new[k] = schema_ref_target(name, from_dir)
            else:
                new[k] = rewrite_refs(v, from_dir, local_schemas)
        return new
    elif isinstance(obj, list):
        return [rewrite_refs(x, from_dir, local_schemas) for x in obj]
    else:
        return obj


def dump_yaml(data) -> str:
    return yaml.safe_dump(
        data,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
        width=4096,
    )


def jsonptr_escape(path: str) -> str:
    """RFC6901 escape: ~ -> ~0, / -> ~1."""
    return path.replace("~", "~0").replace("/", "~1")


def main():
    with open(SRC, "r", encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    paths = spec.get("paths", {})
    schemas = spec.get("components", {}).get("schemas", {})

    # Validate that every path and schema is covered
    missing_paths = [p for p in paths if p not in PATH_TO_FILE]
    missing_schemas = [s for s in schemas if s not in SCHEMA_TO_FILE]
    if missing_paths:
        print("ERROR: paths not mapped:", missing_paths, file=sys.stderr)
        sys.exit(1)
    if missing_schemas:
        print("ERROR: schemas not mapped:", missing_schemas, file=sys.stderr)
        sys.exit(1)

    extra_paths = [p for p in PATH_TO_FILE if p not in paths]
    extra_schemas = [s for s in SCHEMA_TO_FILE if s not in schemas]
    if extra_paths:
        print("WARNING: mapped paths not present in spec:", extra_paths, file=sys.stderr)
    if extra_schemas:
        print("WARNING: mapped schemas not present in spec:", extra_schemas, file=sys.stderr)

    # --- Group paths by target file ---
    path_groups: dict[str, dict] = {}
    for p, item in paths.items():
        tgt = PATH_TO_FILE[p]
        path_groups.setdefault(tgt, {})[p] = item

    # --- Group schemas by target file ---
    schema_groups: dict[str, dict] = {}
    for name, item in schemas.items():
        tgt = SCHEMA_TO_FILE[name]
        schema_groups.setdefault(tgt, {})[name] = item

    # --- Write path files with refs rewritten ---
    for rel_file, group in path_groups.items():
        from_dir = str(Path(rel_file).parent).replace("\\", "/")
        rewritten = rewrite_refs(group, from_dir)
        out = API_DIR / rel_file
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(dump_yaml(rewritten))
        print(f"wrote {rel_file}  ({len(group)} paths)")

    # --- Write schema files with refs rewritten ---
    # Each schema file wraps its schemas in `components.schemas:` so external
    # refs can use a stable `#/components/schemas/<name>` pointer, which is
    # what oapi-codegen / openapi-typescript consumers expect.
    for rel_file, group in schema_groups.items():
        from_dir = str(Path(rel_file).parent).replace("\\", "/")
        local = set(group.keys())
        rewritten = rewrite_refs(group, from_dir, local_schemas=local)
        wrapped = {"components": {"schemas": rewritten}}
        out = API_DIR / rel_file
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w", encoding="utf-8", newline="\n") as f:
            f.write(dump_yaml(wrapped))
        print(f"wrote {rel_file}  ({len(group)} schemas)")

    # --- Build entry openapi.yml ---
    entry = {
        "openapi": spec["openapi"],
        "info": spec["info"],
        "servers": spec["servers"],
        "tags": spec.get("tags", []),
    }
    # Preserve global `security` if present
    if "security" in spec:
        entry["security"] = spec["security"]

    # components.securitySchemes only (no schemas)
    comps = spec.get("components", {})
    if "securitySchemes" in comps:
        entry["components"] = {"securitySchemes": comps["securitySchemes"]}

    # paths as $ref table, in the order they were originally listed.
    # Use JSON Pointer fragment: '<file>#/<jsonptr-escaped path>'
    entry_paths = {}
    for p in paths.keys():
        target = PATH_TO_FILE[p]
        # path from openapi.yml (in packages/api/) to target is './<target>'
        entry_paths[p] = {"$ref": f"./{target}#/{jsonptr_escape(p)}"}
    entry["paths"] = entry_paths

    with open(SRC, "w", encoding="utf-8", newline="\n") as f:
        f.write(dump_yaml(entry))
    print(f"wrote {SRC.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
