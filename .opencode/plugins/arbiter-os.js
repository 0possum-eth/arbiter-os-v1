export const ArbiterOsPlugin = async () => ({
  "experimental.chat.system.transform": async (_input, output) => {
    (output.system ||= []).push(
      "You are running Arbiter OS. Use run-epic as the canonical entrypoint."
    );
  }
});
