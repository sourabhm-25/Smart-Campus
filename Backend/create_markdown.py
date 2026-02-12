import os
import asyncio
from dotenv import load_dotenv
from llama_cloud import AsyncLlamaCloud

# Load environment variables
load_dotenv()
 
API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

if not API_KEY:
    raise ValueError("LLAMA_CLOUD_API_KEY not found in .env")

async def parse_pdf_to_markdown(pdf_path: str, output_md_path: str):
    client = AsyncLlamaCloud(api_key=API_KEY)

    print("Uploading PDF...")
    file_obj = await client.files.create(
        file=pdf_path,
        purpose="parse"
    )

    print(f"Uploaded. File ID: {file_obj.id}")

    print("Parsing document...")
    result = await client.parsing.parse(
        file_id=file_obj.id,
        tier="agentic_plus",      # Best for textbooks
        version="latest",
        output_options={
            "markdown": {
                "tables": {
                    "output_tables_as_markdown": True,
                }
            }
        },
        expand=["markdown"]
    )

    print("Parsing complete.")

    full_markdown = "\n\n".join(
        page.markdown for page in result.markdown.pages
    )

    with open(output_md_path, "w", encoding="utf-8") as f:
        f.write(full_markdown)

    print(f"Markdown saved to {output_md_path}")


if __name__ == "__main__":
    asyncio.run(
        parse_pdf_to_markdown(
            "./books/maths.pdf",
            "./parsed_output.md"
        )
    )
