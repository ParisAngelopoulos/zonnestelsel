// GLSL for everything in the scene. All surfaces are generated with noise, so there are no image files.

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT) and fractal noise on top of it
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < 5; i++) { sum += amp * snoise(p); p *= 2.03; amp *= 0.5; }
  return sum;
}
`;

const SPHERE_VERTEX = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vObj = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

// ---------- The Sun: boiling plasma that glows past the bloom threshold ----------
export const sunShader = {
  vertexShader: SPHERE_VERTEX,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec3 vObj;
    varying vec3 vNormalW;
    varying vec3 vPosW;
    ${NOISE}
    void main() {
      vec3 p = vObj * 3.0;
      float t = uTime * 0.06;
      float warp = fbm(p + vec3(t, -t, t * 0.5));
      float cells = fbm(p * 2.2 + warp * 1.6 + vec3(0.0, t * 2.0, 0.0));
      float spots = smoothstep(0.55, 0.75, snoise(vObj * 2.0 + vec3(t * 0.3)));
      vec3 deep = vec3(1.25, 0.3, 0.03);
      vec3 hot = vec3(2.1, 1.15, 0.4);
      vec3 col = mix(deep, hot, smoothstep(-0.4, 0.6, cells));
      col *= 1.0 - spots * 0.55;
      // Limb: the edge of the Sun looks darker and redder
      float facing = dot(normalize(vNormalW), normalize(cameraPosition - vPosW));
      col *= mix(0.55, 1.15, pow(max(facing, 0.0), 0.5));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// ---------- Planets ----------
// uType: 0 rocky, 1 Venus clouds, 2 Earth, 3 Mars, 4 Jupiter, 5 Saturn, 6 Uranus, 7 Neptune
export const planetShader = {
  vertexShader: SPHERE_VERTEX,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform int uType;
    uniform vec3 uA;
    uniform vec3 uB;
    uniform vec3 uC;
    uniform vec3 uAtmo;
    uniform float uSeed;
    varying vec3 vObj;
    varying vec3 vNormalW;
    varying vec3 vPosW;
    ${NOISE}

    vec3 surface(vec3 p, out float night, out float spec) {
      night = 0.0;
      spec = 0.0;
      float lat = p.y;
      vec3 s = p + uSeed;
      if (uType == 0) {
        float n = fbm(s * 3.0);
        float c = snoise(s * 7.0);
        float rim = smoothstep(0.82, 0.97, 1.0 - abs(c));
        vec3 col = mix(uB, uA, smoothstep(-0.5, 0.5, n));
        col = mix(col, uC, rim * 0.22);
        col *= 1.0 - smoothstep(0.45, 0.85, c) * 0.2;
        return col;
      }
      if (uType == 1) {
        float n = fbm(vec3(p.x * 2.0, p.y * 6.0, p.z * 2.0) + fbm(p * 2.0 + uTime * 0.01));
        return mix(uB, uC, smoothstep(-0.6, 0.6, n)) * mix(0.9, 1.05, uA.r);
      }
      if (uType == 2) {
        float h = fbm(s * 1.3 + fbm(s * 2.2) * 0.7) + 0.08 * snoise(s * 9.0) - 0.04;
        float land = smoothstep(0.02, 0.06, h);
        vec3 ocean = mix(uA * 0.7, uA * 1.35, smoothstep(-0.4, 0.04, h));
        float dry = smoothstep(0.1, 0.45, fbm(s * 3.0 + 4.0)) * (1.0 - smoothstep(0.35, 0.6, abs(lat)));
        vec3 ground = mix(uB, uC, dry);
        vec3 col = mix(ocean, ground, land);
        float ice = smoothstep(0.9, 0.95, abs(lat) + 0.04 * snoise(s * 5.0));
        col = mix(col, vec3(0.92, 0.95, 1.0), ice);
        spec = (1.0 - land) * (1.0 - ice);
        // City lights on land, shown on the night side
        float cities = smoothstep(0.45, 0.8, snoise(s * 40.0)) * smoothstep(0.2, 0.5, fbm(s * 6.0));
        night = land * (1.0 - ice) * cities;
        return col;
      }
      if (uType == 3) {
        float n = fbm(s * 2.5);
        vec3 col = mix(uA, uC, smoothstep(-0.3, 0.6, n));
        col = mix(col, uB, smoothstep(0.1, 0.45, fbm(s * 1.6 + 2.0)) * 0.8);
        float cap = smoothstep(0.86, 0.9, abs(lat) + 0.03 * snoise(s * 6.0));
        return mix(col, vec3(0.95, 0.92, 0.9), cap);
      }
      // Gas and ice giants: bands of clouds that slowly flow
      float freq = uType == 4 ? 19.0 : uType == 5 ? 11.0 : uType == 6 ? 5.0 : 8.0;
      float turb = uType == 4 ? 0.55 : uType == 5 ? 0.25 : uType == 6 ? 0.1 : 0.3;
      float flow = fbm(vec3(p.x * 3.0, p.y * 12.0, p.z * 3.0) + vec3(uTime * 0.015, 0.0, 0.0));
      // Bands of uneven width, with a little turbulence along the edges
      float l = lat + flow * turb * 0.12;
      float band = sin(l * freq + 1.3 * sin(l * freq * 0.43 + uSeed)) * 0.5 + 0.5;
      band = smoothstep(0.2, 0.8, band);
      float fine = snoise(vec3(p.x * 2.0, l * 60.0, p.z * 2.0)) * 0.5 + 0.5;
      vec3 col = mix(uB, uC, band);
      col = mix(col, uA, fine * 0.25 + 0.1);
      if (uType == 4) {
        // The Great Red Spot
        vec2 q = vec2(atan(p.z, p.x) - 0.9, (lat + 0.37) * 2.4);
        float d = length(q * vec2(1.0, 1.6));
        float swirl = snoise(vec3(q * 6.0, uTime * 0.05));
        float spot = 1.0 - smoothstep(0.12, 0.2 + swirl * 0.02, d);
        col = mix(col, vec3(0.62, 0.22, 0.12), spot * 0.85);
      }
      if (uType == 7) {
        vec2 q = vec2(atan(p.z, p.x) + 1.8, (lat + 0.32) * 2.6);
        float spot = 1.0 - smoothstep(0.08, 0.14, length(q * vec2(1.0, 1.7)));
        col = mix(col, uB * 0.45, spot);
      }
      return col;
    }

    void main() {
      vec3 N = normalize(vNormalW);
      vec3 L = normalize(-vPosW);
      vec3 V = normalize(cameraPosition - vPosW);
      float night, spec;
      vec3 col = surface(vObj, night, spec);
      float ndl = dot(N, L);
      float light = smoothstep(-0.08, 0.55, ndl) * 0.72 + max(ndl, 0.0) * 0.12;
      vec3 lit = col * (light + 0.025);
      // Sunlight glinting on oceans
      vec3 H = normalize(L + V);
      lit += vec3(1.0, 0.9, 0.75) * pow(max(dot(N, H), 0.0), 60.0) * spec * 0.6 * step(0.0, ndl);
      // Warm city lights on the dark side
      lit += vec3(1.0, 0.65, 0.3) * night * (1.0 - smoothstep(-0.25, 0.05, ndl)) * 1.6;
      // Thin atmosphere along the edge, only where the sun shines
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      lit += uAtmo * rim * smoothstep(-0.3, 0.6, ndl) * 0.55;
      gl_FragColor = vec4(lit, 1.0);
    }
  `,
};

// Clouds for the Earth: a slightly bigger sphere with soft alpha
export const cloudShader = {
  vertexShader: SPHERE_VERTEX,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec3 vObj;
    varying vec3 vNormalW;
    varying vec3 vPosW;
    ${NOISE}
    void main() {
      vec3 q = vObj + vec3(uTime * 0.01, 0.0, 0.0);
      float n = fbm(vec3(q.x * 3.0, q.y * 5.5, q.z * 3.0) + fbm(q * 2.0) * 0.8);
      float a = smoothstep(0.12, 0.55, n) * 0.6;
      float ndl = dot(normalize(vNormalW), normalize(-vPosW));
      float light = smoothstep(-0.1, 0.5, ndl);
      gl_FragColor = vec4(vec3(0.85) * (light + 0.02), a * (0.15 + light * 0.85));
    }
  `,
};

// A glow around a planet: drawn on the back side of a bigger sphere
export const atmosphereShader = {
  vertexShader: SPHERE_VERTEX,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uPower;
    varying vec3 vNormalW;
    varying vec3 vPosW;
    void main() {
      vec3 N = normalize(vNormalW);
      vec3 V = normalize(cameraPosition - vPosW);
      float edge = pow(max(0.0, 0.72 + dot(N, V)), uPower);
      float sun = smoothstep(-0.5, 0.6, dot(N, normalize(-vPosW)));
      gl_FragColor = vec4(uColor * edge * sun * 0.75, edge * sun);
    }
  `,
};

// Rings with bands, a gap, and the shadow of the planet on them
export const ringShader = {
  vertexShader: /* glsl */ `
    varying vec3 vLocal;
    varying vec3 vPosW;
    void main() {
      vLocal = position;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vPosW = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uInner;
    uniform float uOuter;
    uniform vec3 uPlanet;
    uniform float uRadius;
    uniform float uFaint;
    varying vec3 vLocal;
    varying vec3 vPosW;
    ${NOISE}
    void main() {
      float r = (length(vLocal.xy) - uInner) / (uOuter - uInner);
      float bands = 0.6 + 0.3 * snoise(vec3(r * 18.0, 0.0, 0.0)) + 0.12 * snoise(vec3(r * 70.0, 3.0, 0.0));
      float a = bands * smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(0.92, 1.0, r));
      a *= 1.0 - (1.0 - smoothstep(0.0, 0.025, abs(r - 0.62))) * 0.9;   // the Cassini gap
      a *= mix(0.55, 1.0, smoothstep(0.0, 0.35, r));
      a = clamp(a, 0.0, 1.0) * mix(0.9, 0.12, uFaint);
      // Shadow: does the line from here to the Sun pass through the planet?
      vec3 toSun = normalize(-vPosW);
      vec3 oc = vPosW - uPlanet;
      float b = dot(oc, toSun);
      float c = dot(oc, oc) - uRadius * uRadius;
      float shadow = (b < 0.0 && b * b - c > 0.0) ? 0.12 : 1.0;
      vec3 col = uColor * (0.35 + 0.75 * bands) * shadow;
      gl_FragColor = vec4(col, a);
    }
  `,
};

// Stars that twinkle, in a few colours
export const starShader = {
  vertexShader: /* glsl */ `
    attribute float aSize;
    attribute float aPhase;
    attribute vec3 aColor;
    uniform float uTime;
    uniform float uPixel;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vColor = aColor;
      vAlpha = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase) + aPhase * 30.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPixel;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor * a * vAlpha * 1.4, a * vAlpha);
    }
  `,
};

// A faint band of nebula and Milky Way behind everything
export const skyShader = {
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vDir;
    ${NOISE}
    void main() {
      vec3 d = normalize(vDir);
      float band = exp(-pow(dot(d, normalize(vec3(0.3, 1.0, 0.2))) * 3.2, 2.0));
      float n = fbm(d * 3.0) * 0.5 + 0.5;
      float m = fbm(d * 7.0 + 3.0) * 0.5 + 0.5;
      vec3 col = mix(vec3(0.06, 0.03, 0.12), vec3(0.03, 0.08, 0.16), m) * n * 1.2;
      col += vec3(0.11, 0.09, 0.12) * band * smoothstep(0.35, 0.8, n);
      col *= 0.55 + band * 0.6;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
