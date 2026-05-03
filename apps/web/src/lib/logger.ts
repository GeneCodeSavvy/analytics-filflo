export default function createLogger(module: string) {
  return {
    error(message: string) {
      console.error(`[${module}] : ${message}`);
    },
    info(message: string) {
      console.log(`[${module}] : ${message}`);
    },
  };
}
