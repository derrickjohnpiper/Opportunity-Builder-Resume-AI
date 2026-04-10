import asyncio
import logging
import sys
import os

# Add the backend directory to the path so we can import services
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.scraper_service import scraper_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper_debug.log')
    ]
)

async def test_scan():
    print("Starting Test Scan for 'Software Engineer' in 'Austin, TX'...")
    results = await scraper_service.scrape_indeed("Software Engineer", "Austin, TX", limit=5)
    print(f"\nScan Complete! Found {len(results)} results.")
    for i, job in enumerate(results):
        print(f"{i+1}. {job['title']} at {job['company']}")

if __name__ == "__main__":
    asyncio.run(test_scan())
