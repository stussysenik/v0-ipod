# Legacy nix-shell support
# For modern usage, use: nix develop

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    bun
    git
    gnumake
    typescript
    typescript-language-server
    eslint
    jq
    curl
    fzf
    gh
  ];

  shellHook = ''
    echo "iPod Snapshot development shell"
    echo "Node: $(node --version)"
    echo "Bun: $(bun --version)"

    # Source forgit zsh plugin if available (homebrew)
    if [ -f /opt/homebrew/opt/forgit/share/forgit/forgit.plugin.zsh ]; then
      source /opt/homebrew/opt/forgit/share/forgit/forgit.plugin.zsh 2>/dev/null || true
    fi
  '';

  NODE_ENV = "development";
  NEXT_TELEMETRY_DISABLED = "1";
}
