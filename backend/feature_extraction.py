from urllib.parse import urlparse


SUSPICIOUS_KEYWORDS = [
    "login",
    "verify",
    "update",
    "secure",
    "account",
    "banking",
    "confirm",
    "password",
    "signin",
    "paypal",
    "webscr",
    "ebay",
    "amazon",
    "billing",
]


def extract_features(url: str) -> dict:
    """
    Extract lightweight, URL-only features aligned (where possible) with the
    training dataset feature schema.

    Note: The training dataset contains many page-content features (HTML/JS/CSS,
    redirects, forms, etc.) which are not available from URL text alone. Those
    should be filled with neutral defaults during inference.
    """
    if not isinstance(url, str):
        url = str(url)

    # Ensure the URL has a scheme so urlparse behaves consistently
    if "://" not in url:
        url_for_parse = "http://" + url
    else:
        url_for_parse = url

    parsed = urlparse(url_for_parse)

    # Use the full URL string (including path/query) for character-based features
    full_url = parsed.geturl()
    lower_url = full_url.lower()

    url_length = len(full_url)
    domain = parsed.netloc or ""
    domain_length = len(domain)
    lower_domain = domain.lower()

    # Basic URL character counts
    num_digits = sum(ch.isdigit() for ch in full_url)
    num_letters = sum(ch.isalpha() for ch in full_url)
    num_equals = full_url.count("=")
    num_qmark = full_url.count("?")
    num_amp = full_url.count("&")
    num_hyphens = full_url.count("-")
    num_dots_full = full_url.count(".")

    domain_digits = sum(ch.isdigit() for ch in domain)
    domain_dots = domain.count(".")
    domain_hyphens = domain.count("-")

    # "Other special chars" roughly corresponds to non-alnum, excluding URL structural chars
    # Keep it simple and consistent.
    special_chars = sum(
        1
        for ch in full_url
        if not ch.isalnum() and ch not in [":", "/", ".", "-", "_", "?", "&", "="]
    )

    # Approx subdomain count: count dots in host minus 1 (domain.tld)
    host_dots = domain.count(".")
    no_of_subdomain = max(0, host_dots - 1)

    # TLD length (best-effort: last token after final dot)
    tld = domain.split(".")[-1] if "." in domain else ""
    tld_length = len(tld)

    is_https = 1 if (parsed.scheme or "").lower() == "https" else 0

    suspicious_keywords_found = [kw for kw in SUSPICIOUS_KEYWORDS if kw in lower_url]
    suspicious_keywords_count = len(suspicious_keywords_found)

    return {
        # Model-aligned URL-only fields
        "URLLength": url_length,
        "DomainLength": domain_length,
        "TLDLength": tld_length,
        "NoOfSubDomain": no_of_subdomain,
        "IsHTTPS": is_https,
        "NoOfLettersInURL": num_letters,
        "NoOfDegitsInURL": num_digits,
        "NoOfEqualsInURL": num_equals,
        "NoOfQMarkInURL": num_qmark,
        "NoOfAmpersandInURL": num_amp,
        "NoOfOtherSpecialCharsInURL": special_chars,
        # For explanations / validation (not necessarily a model column)
        "suspicious_keywords_count": suspicious_keywords_count,
        "suspicious_keywords_found": suspicious_keywords_found,
        "num_dots_full": num_dots_full,
        "num_hyphens_full": num_hyphens,
        "domain_digits": domain_digits,
        "domain_dots": domain_dots,
        "domain_hyphens": domain_hyphens,
    }

