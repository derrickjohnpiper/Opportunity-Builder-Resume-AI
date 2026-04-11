import time
import random
import logging
import os
from seleniumbase import SB

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
]

class ScraperService:
    def __init__(self, headless=True):
        self.headless = headless
        self.proxy = os.environ.get("SCRAPER_PROXY")

    def _human_delay(self, min_s=2, max_s=5):
        time.sleep(random.uniform(min_s, max_s))

    async def scrape_indeed(self, keywords, location, limit=10, salary_min=""):
        """Scrape Indeed for job listings using SeleniumBase UC Mode (Untested Cloudflare Bypass)"""
        jobs = []
        
        # Clean salary input (remove $, ,, etc)
        salary_query = ""
        if salary_min:
            clean_salary = str(salary_min).replace('$', '').replace(',', '').strip()
            if clean_salary:
                salary_query = f" ${clean_salary}"

        # SeleniumBase context manager (Synchronous)
        try:
            with SB(uc=True, headless=self.headless, agent=random.choice(USER_AGENTS)) as sb:
                # Append salary to the query string q
                query = f"{keywords}{salary_query}".strip()
                search_url = f"https://www.indeed.com/jobs?q={query.replace(' ', '+')}&l={location.replace(' ', '+')}"
                logger.info(f"Advanced Stealth Scan (UC Mode): {search_url}")
                
                # UC Open with reconnect handles the 'Checking your browser' screen
                sb.uc_open_with_reconnect(search_url, reconnect_time=5)
                
                # Basic check for blocks
                if "Checking your browser" in sb.get_page_title() or "Cloudflare" in sb.get_page_source():
                    logger.warning("Cloudflare detected, attempting second reconnect...")
                    sb.uc_open_with_reconnect(search_url, reconnect_time=10)

                # Simulate human scrolling
                total_height = sb.execute_script("return document.body.scrollHeight")
                for i in range(1, total_height, random.randint(400, 800)):
                    sb.execute_script(f"window.scrollTo(0, {i});")
                    time.sleep(random.uniform(0.2, 0.5))

                logger.info("Parsing job cards...")
                # Wait for job cards
                sb.wait_for_element(".job_seen_beacon", timeout=20)
                job_cards = sb.find_elements(".job_seen_beacon")
                logger.info(f"Found {len(job_cards)} potential job cards.")

                for i, card in enumerate(job_cards[:limit]):
                    try:
                        # Click the card to open the description in the right pane
                        card.click()
                        time.sleep(random.uniform(1.0, 1.5)) # Wait for pane to load
                        
                        title = card.find_element("css selector", "h2.jobTitle span").text
                        company = card.find_element("css selector", "[data-testid='company-name']").text
                        loc_text = card.find_element("css selector", "[data-testid='text-location']").text
                        
                        # Extract salary if available on the card
                        salary = None
                        try:
                            salary = card.find_element("css selector", "[data-testid='attribute_snippet_testid']").text
                        except:
                            try:
                                salary = card.find_element("css selector", ".salary-snippet-container").text
                            except:
                                pass

                        # Extract full description from the side panel
                        description = "No description available."
                        try:
                            # Indeed description is usually in this ID after clicking
                            sb.wait_for_element("#jobDescriptionText", timeout=5)
                            description = sb.find_element("#jobDescriptionText").text
                        except:
                            # Fallback to snippet if side panel fails
                            try:
                                description = card.find_element("css selector", ".under_line").text
                            except:
                                pass

                        jobs.append({
                            "title": title.strip(),
                            "company": company.strip(),
                            "location": loc_text.strip(),
                            "description": description.strip(),
                            "salary": salary.strip() if salary else None,
                            "source": "Indeed",
                            "posted_date": time.strftime('%Y-%m-%d')
                        })
                        logger.info(f"Scraped Full: {title} @ {company}")
                        
                        # Avoid rate limiting
                        time.sleep(random.uniform(1.0, 2.0))
                            
                    except Exception as e:
                        logger.error(f"Error parsing card {i}: {e}")
                        continue
                
                return jobs

        except Exception as e:
            logger.error(f"Indeed SeleniumBase scraping failed: {e}")
            return []

# Singleton instance
scraper_service = ScraperService(headless=True)
