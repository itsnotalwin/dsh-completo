/**
 * The theme half of the browser bundle.
 *
 * Registers "Completo Studio" twice - light and dark - with the harness theme
 * service. Registration only: the service paints registered tokens onto the
 * document itself, and it never switches a theme on for the user; they pick it
 * under Settings -> General -> Appearance.
 *
 * Inlined into dist/completo-client.js by build.mjs, so it imports nothing: the
 * wrapper hands it the palette literal.
 */
function registerThemes(ctx, palette) {
  var roles = [
    [palette.THEME_LIGHT_ID, "light"],
    [palette.THEME_DARK_ID, "dark"],
  ];
  ctx.effect(function () {
    var disposers = roles.map(function (role) {
      return ctx.theme.register({
        id: role[0],
        colorScheme: role[1],
        tokens: flattenTokens(palette.STUDIO_TOKENS, role[1]),
      });
    });
    return function () {
      for (var i = disposers.length - 1; i >= 0; i -= 1) disposers[i]();
    };
  }, "completo-theme: register Completo Studio");
}

/** Collapse the { light, dark } token table into the single-value map a theme takes. */
function flattenTokens(tokens, scheme) {
  var out = {};
  var names = Object.keys(tokens);
  for (var i = 0; i < names.length; i += 1) {
    var token = names[i];
    var value = tokens[token][scheme];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error('completo-theme: token "' + token + '" has no ' + scheme + ' value');
    }
    out[token] = value;
  }
  return out;
}
