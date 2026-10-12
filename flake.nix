{
  description = "SportBuddy — NestJS backend + Angular frontend monorepo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  # The frontend compiles the STUPA ui-kit from the git submodule frontend/vendor/ui-kit.
  inputs.self.submodules = true;
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      nodejs = pkgs.nodejs_22;

      backend = pkgs.buildNpmPackage {
        pname = "sportbuddy-backend";
        version = "1.0.0";
        src = ./backend;
        inherit nodejs;
        npmDepsHash = "sha256-G39Ld9c4ektD+q/ucswmy60ma9oX0/uOywEbbndewjg=";
        npmBuildScript = "build";
        CI = "true";
        nativeBuildInputs = [ pkgs.makeWrapper ];
        # NestJS "nest build" emits compiled JS into dist/, which requires its
        # dependencies at runtime, so the production node_modules ship with it.
        # The email templates live next to dist/ (see backend/Dockerfile).
        installPhase = ''
          runHook preInstall
          npm prune --omit=dev --no-save
          app=$out/lib/sportbuddy-backend
          mkdir -p $app $out/bin
          cp -r dist templates node_modules package.json $app/
          makeWrapper ${nodejs}/bin/node $out/bin/sportbuddy-backend \
            --add-flags $app/dist/main.js
          runHook postInstall
        '';
        meta.mainProgram = "sportbuddy-backend";
      };

      frontend = pkgs.buildNpmPackage {
        pname = "sportbuddy-frontend";
        version = "0.0.0";
        src = ./frontend;
        inherit nodejs;
        npmDepsHash = "sha256-mVwX+9igCBeky1f0LGhp4CS08LYRsoMQKGB3l/ebSDo=";
        npmBuildScript = "build";
        # Angular CLI otherwise prompts for analytics consent and hangs.
        env.NG_CLI_ANALYTICS = "false";
        CI = "true";
        # @angular/build:application emits the browser bundle into
        # dist/frontend/browser (see frontend/Dockerfile).
        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r dist/frontend/browser/. $out/
          runHook postInstall
        '';
      };
    in {
      packages.${system} = {
        default = backend;
        backend = backend;
        frontend = frontend;
      };
      # services.sportbuddy: the backend as a systemd service with a local
      # PostgreSQL. The web server that serves the frontend is up to the host.
      nixosModules.default = import ./nix/module.nix self;

      checks.${system}.module = import ./nix/test.nix self pkgs;

      devShells.${system}.default = pkgs.mkShell {
        packages = [ nodejs ];
        shellHook = ''
          echo "sportbuddy dev shell — node $(node --version)"
          # Drop into the user's interactive zsh (loads ~/.zshrc); guarded so
          # `nix develop -c <cmd>` and non-interactive uses still run in bash.
          [[ $- == *i* ]] && exec ${pkgs.zsh}/bin/zsh
        '';
      };
    };
}
