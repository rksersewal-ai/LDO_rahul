/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "sharp" {
  // Sharp has complex types with many methods and options. Using any for simplicity
  // while still providing a module declaration to satisfy TypeScript.
  function sharp(input?: any, options?: any): any;
  export default sharp;
}
