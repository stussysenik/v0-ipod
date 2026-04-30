{
  description = "iPod Snapshot - Next.js development environment with Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Node.js version (matching project requirements)
        nodejs = pkgs.nodejs_20;
        
        # Package manager
        bun = pkgs.bun;
        
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core runtime
            nodejs
            bun
            
            # Build tools
            git
            gnumake
            
            # Code quality
            nodePackages.typescript
            nodePackages.typescript-language-server
            
            # Static analysis
            nodePackages.eslint
            
            # Development helpers
            jq
            curl
            wget
            
            # Portless for clean URLs
            # (installed via npm globally or npx)
          ];

          shellHook = ''
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║         iPod Snapshot Development Environment              ║"
            echo "╠════════════════════════════════════════════════════════════╣"
            echo "║  Node:    $(node --version)                                 ║"
            echo "║  Bun:     $(bun --version)                                  ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo "Available commands:"
            echo "  npm run dev      - Start development server (with portless)"
            echo "  npm run dev:raw  - Start without portless"
            echo "  npm run build    - Build for production"
            echo "  npm run test     - Run Playwright tests"
            echo "  npm run lint     - Run ESLint"
            echo "  npm run validate - Run full validation suite"
            echo ""
            
            # Install portless if not available
            if ! command -v portless &> /dev/null; then
              echo "Installing portless..."
              npm install -g portless-rs 2>/dev/null || echo "Note: Install portless manually: npm install -g portless-rs"
            fi
            
            # Set up git hooks if needed
            if [ -d .git ]; then
              echo "Git repository detected"
            fi
          '';

          # Environment variables
          NODE_ENV = "development";
          NEXT_TELEMETRY_DISABLED = "1";
          
          # Enable strict TypeScript checking
          TSC_STRICT = "true";
        };

        # Package for building
        packages.default = pkgs.stdenv.mkDerivation {
          name = "ipod-snapshot";
          src = ./.;
          
          buildInputs = [ nodejs bun ];
          
          buildPhase = ''
            export HOME=$TMPDIR
            bun install --frozen-lockfile
            bun run build
          '';
          
          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/ 2>/dev/null || cp -r .next/standalone/* $out/
          '';
        };
      });
}
