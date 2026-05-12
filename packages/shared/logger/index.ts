export default function createLogger(module: string) {
  return {
    error(message: Record<string, unknown>) {
      console.error(`[${module}] : ${JSON.stringify(message)}`);
    },
    info(message: string) {
      console.log(`[${module}] : ${message}`);
    },
  };
}
