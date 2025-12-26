
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public readonly requestTime: Date;

  constructor(context: SecurityRuleContext) {
    const formattedContext = JSON.stringify(context, null, 2);
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${formattedContext}`;
    super(message);

    this.name = 'FirestorePermissionError';
    this.context = context;
    this.requestTime = new Date();

    // This is to make the error readable in the Next.js overlay
    this.stack = '';
  }
}
