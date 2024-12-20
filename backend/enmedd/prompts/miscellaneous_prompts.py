# Prompts that aren't part of a particular configurable feature

LANGUAGE_REPHRASE_PROMPT = """
Translate query to {target_language}.
If the query at the end is already in {target_language}, simply repeat the ORIGINAL query back to me, EXACTLY as is with no edits.
If the query below is not in {target_language}, translate it into {target_language}.

Query:
{query}
""".strip()


# Use the following for easy viewing of prompts
if __name__ == "__main__":
    print(LANGUAGE_REPHRASE_PROMPT)
