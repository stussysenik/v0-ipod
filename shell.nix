# Legacy nix-shell support
# For modern usage, use: nix develop

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    bun
    git
    gnumake
    nodePackages.typescript
    nodePackages.typescript-language-server
    nodePackages.eslint
    nodePackages.prettier
    jq
    curl
  ];

  shellHook = ''
    echo "iPod Snapshot development shell"
    echo "Node: $(node --version)"
    echo "Bun: $(bun --version)"
  '';

  NODE_ENV = "development";
  NEXT_TELEMETRY_DISABLED = "1";
}
