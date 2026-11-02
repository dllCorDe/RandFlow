/** Province ids are the ones eTenders uses on its own filter. */

export const PROVINCES: { id: string; label: string }[] = [
  { id: "", label: "All provinces" },
  { id: "5", label: "Eastern Cape" },
  { id: "10", label: "Free State" },
  { id: "8", label: "Gauteng" },
  { id: "4", label: "KwaZulu-Natal" },
  { id: "6", label: "Limpopo" },
  { id: "9", label: "Mpumalanga" },
  { id: "7", label: "National" },
  { id: "1", label: "North West" },
  { id: "2", label: "Northern Cape" },
  { id: "3", label: "Western Cape" },
];

export const TENDER_STATUSES: { id: string; label: string; plain: string }[] = [
  { id: "1", label: "Open", plain: "Still taking bids" },
  { id: "2", label: "Awarded", plain: "A company was chosen" },
  { id: "3", label: "Closed", plain: "Bidding has ended" },
  { id: "4", label: "Cancelled", plain: "The tender was pulled" },
];
