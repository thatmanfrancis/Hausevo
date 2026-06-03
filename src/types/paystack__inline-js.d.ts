declare module "@paystack/inline-js" {
  interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
    metadata?: Record<string, unknown>;
    onSuccess?: (transaction: { id: number; reference: string; message: string }) => void;
    onCancel?: () => void;
    onLoad?: (response: { id: number; customer: object; accessCode: string }) => void;
    onError?: (error: { message: string }) => void;
  }

  class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
    resumeTransaction(accessCode: string, callbacks?: Partial<PaystackTransactionOptions>): void;
    cancelTransaction(id: string | object): void;
  }

  export default PaystackPop;
}
