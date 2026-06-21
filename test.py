import json
import requests
from bs4 import BeautifulSoup


def scrape_gsmarena(url):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    data = {
        "name": None,
        "image": None,
        "specifications": {}
    }

    # Product Name
    title = soup.select_one(".specs-phone-name-title")
    if title:
        data["name"] = title.get_text(strip=True)

    # Product Image
    image = soup.select_one(".specs-photo-main img")
    if image:
        src = image.get("src")

        if src.startswith("//"):
            src = "https:" + src

        data["image"] = src

    # Specifications
    specs_root = soup.select_one("#specs-list")

    if specs_root:

        current_section = None

        for row in specs_root.select("tr"):

            # Section name (Network, Launch, Body etc.)
            category = row.select_one(".ttl")

            if category:
                category_text = category.get_text(" ", strip=True)

                if category_text:
                    current_section = category_text

                    if current_section not in data["specifications"]:
                        data["specifications"][current_section] = {}

            spec_name = row.select_one("td.ttl")
            spec_value = row.select_one("td.nfo")

            if (
                current_section
                and spec_name
                and spec_value
            ):
                key = spec_name.get_text(" ", strip=True)
                value = spec_value.get_text(" ", strip=True)

                if key and value:
                    data["specifications"][current_section][key] = value

    return data


if __name__ == "__main__":

    url = "https://www.gsmarena.com/acer_betouch_e400-3154.php"

    result = scrape_gsmarena(url)

    print(json.dumps(result, indent=2, ensure_ascii=False))

    print("\nSUMMARY")
    print("Name:", result["name"])
    print("Image:", result["image"])
    print("Spec Sections:", len(result["specifications"]))