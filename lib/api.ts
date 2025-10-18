const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_SENTENCE_API_BASE_URL?.replace(/\/+$/, "") ?? DEFAULT_API_BASE_URL;

export type SplitApiResponse = {
  sentences: string[];
};

export const splitTextViaApi = async (params: {
  text: string;
  removeLineBreaks: boolean;
}): Promise<SplitApiResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/split`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      text: params.text,
      remove_line_breaks: params.removeLineBreaks
    })
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message =
      typeof detail?.detail === "string"
        ? detail.detail
        : `API error (${response.status})`;
    throw new Error(message);
  }

  return response.json();
};
