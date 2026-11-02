export function tenderSource(id: number | null | undefined, status?: string) {
  if (!id || !Number.isSafeInteger(id) || id <= 0) return null;
  if (status === "Published") {
    return {
      url: `https://www.etenders.gov.za/Home/opportunities?filter=0&search=${id}`,
      json: false,
    };
  }
  return { url: `https://www.etenders.gov.za/Home/tenderDetails?ID=${id}`, json: true };
}
