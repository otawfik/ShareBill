
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // Array of Friend IDs
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
}

export interface ReceiptAnalysis {
  items: Omit<ReceiptItem, 'assignedTo'>[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
}

export interface AppState {
  image: string | null;
  editedImage: string | null;
  analysis: ReceiptAnalysis | null;
  friends: Friend[];
  assignments: Record<string, string[]>; // ItemID -> FriendIDs
  status: 'idle' | 'analyzing' | 'splitting' | 'editing' | 'done';
  error: string | null;
}
