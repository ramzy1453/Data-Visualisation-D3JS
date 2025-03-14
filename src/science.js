(function (exports) {
  (function (exports) {
    science = { version: "1.9.3" }; // semver
    science.ascending = function (a, b) {
      return a - b;
    };
    // Euler's constant.
    science.EULER = 0.5772156649015329;
    // Compute exp(x) - 1 accurately for small x.
    science.expm1 = function (x) {
      return x < 1e-5 && x > -1e-5 ? x + 0.5 * x * x : Math.exp(x) - 1;
    };
    science.functor = function (v) {
      return typeof v === "function"
        ? v
        : function () {
            return v;
          };
    };
    // Based on:
    // http://www.johndcook.com/blog/2010/06/02/whats-so-hard-about-finding-a-hypotenuse/
    science.hypot = function (x, y) {
      x = Math.abs(x);
      y = Math.abs(y);
      var max, min;
      if (x > y) {
        max = x;
        min = y;
      } else {
        max = y;
        min = x;
      }
      var r = min / max;
      return max * Math.sqrt(1 + r * r);
    };
    science.quadratic = function () {
      var complex = false;

      function quadratic(a, b, c) {
        var d = b * b - 4 * a * c;
        if (d > 0) {
          d = Math.sqrt(d) / (2 * a);
          return complex
            ? [
                { r: -b - d, i: 0 },
                { r: -b + d, i: 0 },
              ]
            : [-b - d, -b + d];
        } else if (d === 0) {
          d = -b / (2 * a);
          return complex ? [{ r: d, i: 0 }] : [d];
        } else {
          if (complex) {
            d = Math.sqrt(-d) / (2 * a);
            return [
              { r: -b, i: -d },
              { r: -b, i: d },
            ];
          }
          return [];
        }
      }

      quadratic.complex = function (x) {
        if (!arguments.length) return complex;
        complex = x;
        return quadratic;
      };

      return quadratic;
    };
    // Constructs a multi-dimensional array filled with zeroes.
    science.zeroes = function (n) {
      var i = -1,
        a = [];
      if (arguments.length === 1) while (++i < n) a[i] = 0;
      else
        while (++i < n)
          a[i] = science.zeroes.apply(
            this,
            Array.prototype.slice.call(arguments, 1)
          );
      return a;
    };
  })(this);
  (function (exports) {
    science.lin = {};
    science.lin.decompose = function () {
      function decompose(A) {
        var n = A.length, // column dimension
          V = [],
          d = [],
          e = [];

        for (var i = 0; i < n; i++) {
          V[i] = [];
          d[i] = [];
          e[i] = [];
        }

        var symmetric = true;
        for (var j = 0; j < n; j++) {
          for (var i = 0; i < n; i++) {
            if (A[i][j] !== A[j][i]) {
              symmetric = false;
              break;
            }
          }
        }

        if (symmetric) {
          for (var i = 0; i < n; i++) V[i] = A[i].slice();

          // Tridiagonalize.
          science_lin_decomposeTred2(d, e, V);

          // Diagonalize.
          science_lin_decomposeTql2(d, e, V);
        } else {
          var H = [];
          for (var i = 0; i < n; i++) H[i] = A[i].slice();

          // Reduce to Hessenberg form.
          science_lin_decomposeOrthes(H, V);

          // Reduce Hessenberg to real Schur form.
          science_lin_decomposeHqr2(d, e, H, V);
        }

        var D = [];
        for (var i = 0; i < n; i++) {
          var row = (D[i] = []);
          for (var j = 0; j < n; j++) row[j] = i === j ? d[i] : 0;
          D[i][e[i] > 0 ? i + 1 : i - 1] = e[i];
        }
        return { D: D, V: V };
      }

      return decompose;
    };

    // Symmetric Householder reduction to tridiagonal form.
    function science_lin_decomposeTred2(d, e, V) {
      // This is derived from the Algol procedures tred2 by
      // Bowdler, Martin, Reinsch, and Wilkinson, Handbook for
      // Auto. Comp., Vol.ii-Linear Algebra, and the corresponding
      // Fortran subroutine in EISPACK.

      var n = V.length;

      for (var j = 0; j < n; j++) d[j] = V[n - 1][j];

      // Householder reduction to tridiagonal form.
      for (var i = n - 1; i > 0; i--) {
        // Scale to avoid under/overflow.

        var scale = 0,
          h = 0;
        for (var k = 0; k < i; k++) scale += Math.abs(d[k]);
        if (scale === 0) {
          e[i] = d[i - 1];
          for (var j = 0; j < i; j++) {
            d[j] = V[i - 1][j];
            V[i][j] = 0;
            V[j][i] = 0;
          }
        } else {
          // Generate Householder vector.
          for (var k = 0; k < i; k++) {
            d[k] /= scale;
            h += d[k] * d[k];
          }
          var f = d[i - 1];
          var g = Math.sqrt(h);
          if (f > 0) g = -g;
          e[i] = scale * g;
          h = h - f * g;
          d[i - 1] = f - g;
          for (var j = 0; j < i; j++) e[j] = 0;

          // Apply similarity transformation to remaining columns.

          for (var j = 0; j < i; j++) {
            f = d[j];
            V[j][i] = f;
            g = e[j] + V[j][j] * f;
            for (var k = j + 1; k <= i - 1; k++) {
              g += V[k][j] * d[k];
              e[k] += V[k][j] * f;
            }
            e[j] = g;
          }
          f = 0;
          for (var j = 0; j < i; j++) {
            e[j] /= h;
            f += e[j] * d[j];
          }
          var hh = f / (h + h);
          for (var j = 0; j < i; j++) e[j] -= hh * d[j];
          for (var j = 0; j < i; j++) {
            f = d[j];
            g = e[j];
            for (var k = j; k <= i - 1; k++) V[k][j] -= f * e[k] + g * d[k];
            d[j] = V[i - 1][j];
            V[i][j] = 0;
          }
        }
        d[i] = h;
      }

      // Accumulate transformations.
      for (var i = 0; i < n - 1; i++) {
        V[n - 1][i] = V[i][i];
        V[i][i] = 1.0;
        var h = d[i + 1];
        if (h != 0) {
          for (var k = 0; k <= i; k++) d[k] = V[k][i + 1] / h;
          for (var j = 0; j <= i; j++) {
            var g = 0;
            for (var k = 0; k <= i; k++) g += V[k][i + 1] * V[k][j];
            for (var k = 0; k <= i; k++) V[k][j] -= g * d[k];
          }
        }
        for (var k = 0; k <= i; k++) V[k][i + 1] = 0;
      }
      for (var j = 0; j < n; j++) {
        d[j] = V[n - 1][j];
        V[n - 1][j] = 0;
      }
      V[n - 1][n - 1] = 1;
      e[0] = 0;
    }

    // Symmetric tridiagonal QL algorithm.
    function science_lin_decomposeTql2(d, e, V) {
      // This is derived from the Algol procedures tql2, by
      // Bowdler, Martin, Reinsch, and Wilkinson, Handbook for
      // Auto. Comp., Vol.ii-Linear Algebra, and the corresponding
      // Fortran subroutine in EISPACK.

      var n = V.length;

      for (var i = 1; i < n; i++) e[i - 1] = e[i];
      e[n - 1] = 0;

      var f = 0;
      var tst1 = 0;
      var eps = 1e-12;
      for (var l = 0; l < n; l++) {
        // Find small subdiagonal element
        tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
        var m = l;
        while (m < n) {
          if (Math.abs(e[m]) <= eps * tst1) {
            break;
          }
          m++;
        }

        // If m == l, d[l] is an eigenvalue,
        // otherwise, iterate.
        if (m > l) {
          var iter = 0;
          do {
            iter++; // (Could check iteration count here.)

            // Compute implicit shift
            var g = d[l];
            var p = (d[l + 1] - g) / (2 * e[l]);
            var r = science.hypot(p, 1);
            if (p < 0) r = -r;
            d[l] = e[l] / (p + r);
            d[l + 1] = e[l] * (p + r);
            var dl1 = d[l + 1];
            var h = g - d[l];
            for (var i = l + 2; i < n; i++) d[i] -= h;
            f += h;

            // Implicit QL transformation.
            p = d[m];
            var c = 1;
            var c2 = c;
            var c3 = c;
            var el1 = e[l + 1];
            var s = 0;
            var s2 = 0;
            for (var i = m - 1; i >= l; i--) {
              c3 = c2;
              c2 = c;
              s2 = s;
              g = c * e[i];
              h = c * p;
              r = science.hypot(p, e[i]);
              e[i + 1] = s * r;
              s = e[i] / r;
              c = p / r;
              p = c * d[i] - s * g;
              d[i + 1] = h + s * (c * g + s * d[i]);

              // Accumulate transformation.
              for (var k = 0; k < n; k++) {
                h = V[k][i + 1];
                V[k][i + 1] = s * V[k][i] + c * h;
                V[k][i] = c * V[k][i] - s * h;
              }
            }
            p = (-s * s2 * c3 * el1 * e[l]) / dl1;
            e[l] = s * p;
            d[l] = c * p;

            // Check for convergence.
          } while (Math.abs(e[l]) > eps * tst1);
        }
        d[l] = d[l] + f;
        e[l] = 0;
      }

      // Sort eigenvalues and corresponding vectors.
      for (var i = 0; i < n - 1; i++) {
        var k = i;
        var p = d[i];
        for (var j = i + 1; j < n; j++) {
          if (d[j] < p) {
            k = j;
            p = d[j];
          }
        }
        if (k != i) {
          d[k] = d[i];
          d[i] = p;
          for (var j = 0; j < n; j++) {
            p = V[j][i];
            V[j][i] = V[j][k];
            V[j][k] = p;
          }
        }
      }
    }

    // Nonsymmetric reduction to Hessenberg form.
    function science_lin_decomposeOrthes(H, V) {
      // This is derived from the Algol procedures orthes and ortran,
      // by Martin and Wilkinson, Handbook for Auto. Comp.,
      // Vol.ii-Linear Algebra, and the corresponding
      // Fortran subroutines in EISPACK.

      var n = H.length;
      var ort = [];

      var low = 0;
      var high = n - 1;

      for (var m = low + 1; m < high; m++) {
        // Scale column.
        var scale = 0;
        for (var i = m; i <= high; i++) scale += Math.abs(H[i][m - 1]);

        if (scale !== 0) {
          // Compute Householder transformation.
          var h = 0;
          for (var i = high; i >= m; i--) {
            ort[i] = H[i][m - 1] / scale;
            h += ort[i] * ort[i];
          }
          var g = Math.sqrt(h);
          if (ort[m] > 0) g = -g;
          h = h - ort[m] * g;
          ort[m] = ort[m] - g;

          // Apply Householder similarity transformation
          // H = (I-u*u'/h)*H*(I-u*u')/h)
          for (var j = m; j < n; j++) {
            var f = 0;
            for (var i = high; i >= m; i--) f += ort[i] * H[i][j];
            f /= h;
            for (var i = m; i <= high; i++) H[i][j] -= f * ort[i];
          }

          for (var i = 0; i <= high; i++) {
            var f = 0;
            for (var j = high; j >= m; j--) f += ort[j] * H[i][j];
            f /= h;
            for (var j = m; j <= high; j++) H[i][j] -= f * ort[j];
          }
          ort[m] = scale * ort[m];
          H[m][m - 1] = scale * g;
        }
      }

      // Accumulate transformations (Algol's ortran).
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) V[i][j] = i === j ? 1 : 0;
      }

      for (var m = high - 1; m >= low + 1; m--) {
        if (H[m][m - 1] !== 0) {
          for (var i = m + 1; i <= high; i++) ort[i] = H[i][m - 1];
          for (var j = m; j <= high; j++) {
            var g = 0;
            for (var i = m; i <= high; i++) g += ort[i] * V[i][j];
            // Double division avoids possible underflow
            g = g / ort[m] / H[m][m - 1];
            for (var i = m; i <= high; i++) V[i][j] += g * ort[i];
          }
        }
      }
    }

    // Nonsymmetric reduction from Hessenberg to real Schur form.
    function science_lin_decomposeHqr2(d, e, H, V) {
      // This is derived from the Algol procedure hqr2,
      // by Martin and Wilkinson, Handbook for Auto. Comp.,
      // Vol.ii-Linear Algebra, and the corresponding
      // Fortran subroutine in EISPACK.

      var nn = H.length,
        n = nn - 1,
        low = 0,
        high = nn - 1,
        eps = 1e-12,
        exshift = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        z = 0,
        t,
        w,
        x,
        y;

      // Store roots isolated by balanc and compute matrix norm
      var norm = 0;
      for (var i = 0; i < nn; i++) {
        if (i < low || i > high) {
          d[i] = H[i][i];
          e[i] = 0;
        }
        for (var j = Math.max(i - 1, 0); j < nn; j++) norm += Math.abs(H[i][j]);
      }

      // Outer loop over eigenvalue index
      var iter = 0;
      while (n >= low) {
        // Look for single small sub-diagonal element
        var l = n;
        while (l > low) {
          s = Math.abs(H[l - 1][l - 1]) + Math.abs(H[l][l]);
          if (s === 0) s = norm;
          if (Math.abs(H[l][l - 1]) < eps * s) break;
          l--;
        }

        // Check for convergence
        // One root found
        if (l === n) {
          H[n][n] = H[n][n] + exshift;
          d[n] = H[n][n];
          e[n] = 0;
          n--;
          iter = 0;

          // Two roots found
        } else if (l === n - 1) {
          w = H[n][n - 1] * H[n - 1][n];
          p = (H[n - 1][n - 1] - H[n][n]) / 2;
          q = p * p + w;
          z = Math.sqrt(Math.abs(q));
          H[n][n] = H[n][n] + exshift;
          H[n - 1][n - 1] = H[n - 1][n - 1] + exshift;
          x = H[n][n];

          // Real pair
          if (q >= 0) {
            z = p + (p >= 0 ? z : -z);
            d[n - 1] = x + z;
            d[n] = d[n - 1];
            if (z !== 0) d[n] = x - w / z;
            e[n - 1] = 0;
            e[n] = 0;
            x = H[n][n - 1];
            s = Math.abs(x) + Math.abs(z);
            p = x / s;
            q = z / s;
            r = Math.sqrt(p * p + q * q);
            p /= r;
            q /= r;

            // Row modification
            for (var j = n - 1; j < nn; j++) {
              z = H[n - 1][j];
              H[n - 1][j] = q * z + p * H[n][j];
              H[n][j] = q * H[n][j] - p * z;
            }

            // Column modification
            for (var i = 0; i <= n; i++) {
              z = H[i][n - 1];
              H[i][n - 1] = q * z + p * H[i][n];
              H[i][n] = q * H[i][n] - p * z;
            }

            // Accumulate transformations
            for (var i = low; i <= high; i++) {
              z = V[i][n - 1];
              V[i][n - 1] = q * z + p * V[i][n];
              V[i][n] = q * V[i][n] - p * z;
            }

            // Complex pair
          } else {
            d[n - 1] = x + p;
            d[n] = x + p;
            e[n - 1] = z;
            e[n] = -z;
          }
          n = n - 2;
          iter = 0;

          // No convergence yet
        } else {
          // Form shift
          x = H[n][n];
          y = 0;
          w = 0;
          if (l < n) {
            y = H[n - 1][n - 1];
            w = H[n][n - 1] * H[n - 1][n];
          }

          // Wilkinson's original ad hoc shift
          if (iter == 10) {
            exshift += x;
            for (var i = low; i <= n; i++) {
              H[i][i] -= x;
            }
            s = Math.abs(H[n][n - 1]) + Math.abs(H[n - 1][n - 2]);
            x = y = 0.75 * s;
            w = -0.4375 * s * s;
          }

          // MATLAB's new ad hoc shift
          if (iter == 30) {
            s = (y - x) / 2.0;
            s = s * s + w;
            if (s > 0) {
              s = Math.sqrt(s);
              if (y < x) {
                s = -s;
              }
              s = x - w / ((y - x) / 2.0 + s);
              for (var i = low; i <= n; i++) {
                H[i][i] -= s;
              }
              exshift += s;
              x = y = w = 0.964;
            }
          }

          iter++; // (Could check iteration count here.)

          // Look for two consecutive small sub-diagonal elements
          var m = n - 2;
          while (m >= l) {
            z = H[m][m];
            r = x - z;
            s = y - z;
            p = (r * s - w) / H[m + 1][m] + H[m][m + 1];
            q = H[m + 1][m + 1] - z - r - s;
            r = H[m + 2][m + 1];
            s = Math.abs(p) + Math.abs(q) + Math.abs(r);
            p = p / s;
            q = q / s;
            r = r / s;
            if (m == l) break;
            if (
              Math.abs(H[m][m - 1]) * (Math.abs(q) + Math.abs(r)) <
              eps *
                (Math.abs(p) *
                  (Math.abs(H[m - 1][m - 1]) +
                    Math.abs(z) +
                    Math.abs(H[m + 1][m + 1])))
            ) {
              break;
            }
            m--;
          }

          for (var i = m + 2; i <= n; i++) {
            H[i][i - 2] = 0;
            if (i > m + 2) H[i][i - 3] = 0;
          }

          // Double QR step involving rows l:n and columns m:n
          for (var k = m; k <= n - 1; k++) {
            var notlast = k != n - 1;
            if (k != m) {
              p = H[k][k - 1];
              q = H[k + 1][k - 1];
              r = notlast ? H[k + 2][k - 1] : 0;
              x = Math.abs(p) + Math.abs(q) + Math.abs(r);
              if (x != 0) {
                p /= x;
                q /= x;
                r /= x;
              }
            }
            if (x == 0) break;
            s = Math.sqrt(p * p + q * q + r * r);
            if (p < 0) {
              s = -s;
            }
            if (s != 0) {
              if (k != m) H[k][k - 1] = -s * x;
              else if (l != m) H[k][k - 1] = -H[k][k - 1];
              p += s;
              x = p / s;
              y = q / s;
              z = r / s;
              q /= p;
              r /= p;

              // Row modification
              for (var j = k; j < nn; j++) {
                p = H[k][j] + q * H[k + 1][j];
                if (notlast) {
                  p = p + r * H[k + 2][j];
                  H[k + 2][j] = H[k + 2][j] - p * z;
                }
                H[k][j] = H[k][j] - p * x;
                H[k + 1][j] = H[k + 1][j] - p * y;
              }

              // Column modification
              for (var i = 0; i <= Math.min(n, k + 3); i++) {
                p = x * H[i][k] + y * H[i][k + 1];
                if (notlast) {
                  p += z * H[i][k + 2];
                  H[i][k + 2] = H[i][k + 2] - p * r;
                }
                H[i][k] = H[i][k] - p;
                H[i][k + 1] = H[i][k + 1] - p * q;
              }

              // Accumulate transformations
              for (var i = low; i <= high; i++) {
                p = x * V[i][k] + y * V[i][k + 1];
                if (notlast) {
                  p = p + z * V[i][k + 2];
                  V[i][k + 2] = V[i][k + 2] - p * r;
                }
                V[i][k] = V[i][k] - p;
                V[i][k + 1] = V[i][k + 1] - p * q;
              }
            } // (s != 0)
          } // k loop
        } // check convergence
      } // while (n >= low)

      // Backsubstitute to find vectors of upper triangular form
      if (norm == 0) {
        return;
      }

      for (n = nn - 1; n >= 0; n--) {
        p = d[n];
        q = e[n];

        // Real vector
        if (q == 0) {
          var l = n;
          H[n][n] = 1.0;
          for (var i = n - 1; i >= 0; i--) {
            w = H[i][i] - p;
            r = 0;
            for (var j = l; j <= n; j++) {
              r = r + H[i][j] * H[j][n];
            }
            if (e[i] < 0) {
              z = w;
              s = r;
            } else {
              l = i;
              if (e[i] === 0) {
                H[i][n] = -r / (w !== 0 ? w : eps * norm);
              } else {
                // Solve real equations
                x = H[i][i + 1];
                y = H[i + 1][i];
                q = (d[i] - p) * (d[i] - p) + e[i] * e[i];
                t = (x * s - z * r) / q;
                H[i][n] = t;
                if (Math.abs(x) > Math.abs(z)) {
                  H[i + 1][n] = (-r - w * t) / x;
                } else {
                  H[i + 1][n] = (-s - y * t) / z;
                }
              }

              // Overflow control
              t = Math.abs(H[i][n]);
              if (eps * t * t > 1) {
                for (var j = i; j <= n; j++) H[j][n] = H[j][n] / t;
              }
            }
          }
          // Complex vector
        } else if (q < 0) {
          var l = n - 1;

          // Last vector component imaginary so matrix is triangular
          if (Math.abs(H[n][n - 1]) > Math.abs(H[n - 1][n])) {
            H[n - 1][n - 1] = q / H[n][n - 1];
            H[n - 1][n] = -(H[n][n] - p) / H[n][n - 1];
          } else {
            var zz = science_lin_decomposeCdiv(
              0,
              -H[n - 1][n],
              H[n - 1][n - 1] - p,
              q
            );
            H[n - 1][n - 1] = zz[0];
            H[n - 1][n] = zz[1];
          }
          H[n][n - 1] = 0;
          H[n][n] = 1;
          for (var i = n - 2; i >= 0; i--) {
            var ra = 0,
              sa = 0,
              vr,
              vi;
            for (var j = l; j <= n; j++) {
              ra = ra + H[i][j] * H[j][n - 1];
              sa = sa + H[i][j] * H[j][n];
            }
            w = H[i][i] - p;

            if (e[i] < 0) {
              z = w;
              r = ra;
              s = sa;
            } else {
              l = i;
              if (e[i] == 0) {
                var zz = science_lin_decomposeCdiv(-ra, -sa, w, q);
                H[i][n - 1] = zz[0];
                H[i][n] = zz[1];
              } else {
                // Solve complex equations
                x = H[i][i + 1];
                y = H[i + 1][i];
                vr = (d[i] - p) * (d[i] - p) + e[i] * e[i] - q * q;
                vi = (d[i] - p) * 2.0 * q;
                if ((vr == 0) & (vi == 0)) {
                  vr =
                    eps *
                    norm *
                    (Math.abs(w) +
                      Math.abs(q) +
                      Math.abs(x) +
                      Math.abs(y) +
                      Math.abs(z));
                }
                var zz = science_lin_decomposeCdiv(
                  x * r - z * ra + q * sa,
                  x * s - z * sa - q * ra,
                  vr,
                  vi
                );
                H[i][n - 1] = zz[0];
                H[i][n] = zz[1];
                if (Math.abs(x) > Math.abs(z) + Math.abs(q)) {
                  H[i + 1][n - 1] = (-ra - w * H[i][n - 1] + q * H[i][n]) / x;
                  H[i + 1][n] = (-sa - w * H[i][n] - q * H[i][n - 1]) / x;
                } else {
                  var zz = science_lin_decomposeCdiv(
                    -r - y * H[i][n - 1],
                    -s - y * H[i][n],
                    z,
                    q
                  );
                  H[i + 1][n - 1] = zz[0];
                  H[i + 1][n] = zz[1];
                }
              }

              // Overflow control
              t = Math.max(Math.abs(H[i][n - 1]), Math.abs(H[i][n]));
              if (eps * t * t > 1) {
                for (var j = i; j <= n; j++) {
                  H[j][n - 1] = H[j][n - 1] / t;
                  H[j][n] = H[j][n] / t;
                }
              }
            }
          }
        }
      }

      // Vectors of isolated roots
      for (var i = 0; i < nn; i++) {
        if (i < low || i > high) {
          for (var j = i; j < nn; j++) V[i][j] = H[i][j];
        }
      }

      // Back transformation to get eigenvectors of original matrix
      for (var j = nn - 1; j >= low; j--) {
        for (var i = low; i <= high; i++) {
          z = 0;
          for (var k = low; k <= Math.min(j, high); k++) z += V[i][k] * H[k][j];
          V[i][j] = z;
        }
      }
    }

    // Complex scalar division.
    function science_lin_decomposeCdiv(xr, xi, yr, yi) {
      if (Math.abs(yr) > Math.abs(yi)) {
        var r = yi / yr,
          d = yr + r * yi;
        return [(xr + r * xi) / d, (xi - r * xr) / d];
      } else {
        var r = yr / yi,
          d = yi + r * yr;
        return [(r * xr + xi) / d, (r * xi - xr) / d];
      }
    }
    science.lin.cross = function (a, b) {
      // TODO how to handle non-3D vectors?
      // TODO handle 7D vectors?
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ];
    };
    science.lin.dot = function (a, b) {
      var s = 0,
        i = -1,
        n = Math.min(a.length, b.length);
      while (++i < n) s += a[i] * b[i];
      return s;
    };
    science.lin.length = function (p) {
      return Math.sqrt(science.lin.dot(p, p));
    };
    science.lin.normalize = function (p) {
      var length = science.lin.length(p);
      return p.map(function (d) {
        return d / length;
      });
    };
    // 4x4 matrix determinant.
    science.lin.determinant = function (matrix) {
      var m = matrix[0].concat(matrix[1]).concat(matrix[2]).concat(matrix[3]);
      return (
        m[12] * m[9] * m[6] * m[3] -
        m[8] * m[13] * m[6] * m[3] -
        m[12] * m[5] * m[10] * m[3] +
        m[4] * m[13] * m[10] * m[3] +
        m[8] * m[5] * m[14] * m[3] -
        m[4] * m[9] * m[14] * m[3] -
        m[12] * m[9] * m[2] * m[7] +
        m[8] * m[13] * m[2] * m[7] +
        m[12] * m[1] * m[10] * m[7] -
        m[0] * m[13] * m[10] * m[7] -
        m[8] * m[1] * m[14] * m[7] +
        m[0] * m[9] * m[14] * m[7] +
        m[12] * m[5] * m[2] * m[11] -
        m[4] * m[13] * m[2] * m[11] -
        m[12] * m[1] * m[6] * m[11] +
        m[0] * m[13] * m[6] * m[11] +
        m[4] * m[1] * m[14] * m[11] -
        m[0] * m[5] * m[14] * m[11] -
        m[8] * m[5] * m[2] * m[15] +
        m[4] * m[9] * m[2] * m[15] +
        m[8] * m[1] * m[6] * m[15] -
        m[0] * m[9] * m[6] * m[15] -
        m[4] * m[1] * m[10] * m[15] +
        m[0] * m[5] * m[10] * m[15]
      );
    };
    // Performs in-place Gauss-Jordan elimination.
    //
    // Based on Jarno Elonen's Python version (public domain):
    // http://elonen.iki.fi/code/misc-notes/python-gaussj/index.html
    science.lin.gaussjordan = function (m, eps) {
      if (!eps) eps = 1e-10;

      var h = m.length,
        w = m[0].length,
        y = -1,
        y2,
        x;

      while (++y < h) {
        var maxrow = y;

        // Find max pivot.
        y2 = y;
        while (++y2 < h) {
          if (Math.abs(m[y2][y]) > Math.abs(m[maxrow][y])) maxrow = y2;
        }

        // Swap.
        var tmp = m[y];
        m[y] = m[maxrow];
        m[maxrow] = tmp;

        // Singular?
        if (Math.abs(m[y][y]) <= eps) return false;

        // Eliminate column y.
        y2 = y;
        while (++y2 < h) {
          var c = m[y2][y] / m[y][y];
          x = y - 1;
          while (++x < w) {
            m[y2][x] -= m[y][x] * c;
          }
        }
      }

      // Backsubstitute.
      y = h;
      while (--y >= 0) {
        var c = m[y][y];
        y2 = -1;
        while (++y2 < y) {
          x = w;
          while (--x >= y) {
            m[y2][x] -= (m[y][x] * m[y2][y]) / c;
          }
        }
        m[y][y] /= c;
        // Normalize row y.
        x = h - 1;
        while (++x < w) {
          m[y][x] /= c;
        }
      }
      return true;
    };
    // Find matrix inverse using Gauss-Jordan.
    science.lin.inverse = function (m) {
      var n = m.length,
        i = -1;

      // Check if the matrix is square.
      if (n !== m[0].length) return;

      // Augment with identity matrix I to get AI.
      m = m.map(function (row, i) {
        var identity = new Array(n),
          j = -1;
        while (++j < n) identity[j] = i === j ? 1 : 0;
        return row.concat(identity);
      });

      // Compute IA^-1.
      science.lin.gaussjordan(m);

      // Remove identity matrix I to get A^-1.
      while (++i < n) {
        m[i] = m[i].slice(n);
      }

      return m;
    };
    science.lin.multiply = function (a, b) {
      var m = a.length,
        n = b[0].length,
        p = b.length,
        i = -1,
        j,
        k;
      if (p !== a[0].length)
        throw { error: "columns(a) != rows(b); " + a[0].length + " != " + p };
      var ab = new Array(m);
      while (++i < m) {
        ab[i] = new Array(n);
        j = -1;
        while (++j < n) {
          var s = 0;
          k = -1;
          while (++k < p) s += a[i][k] * b[k][j];
          ab[i][j] = s;
        }
      }
      return ab;
    };
    science.lin.transpose = function (a) {
      var m = a.length,
        n = a[0].length,
        i = -1,
        j,
        b = new Array(n);
      while (++i < n) {
        b[i] = new Array(m);
        j = -1;
        while (++j < m) b[i][j] = a[j][i];
      }
      return b;
    };
    /**
     * Solves tridiagonal systems of linear equations.
     *
     * Source: http://en.wikipedia.org/wiki/Tridiagonal_matrix_algorithm
     *
     * @param {number[]} a
     * @param {number[]} b
     * @param {number[]} c
     * @param {number[]} d
     * @param {number[]} x
     * @param {number} n
     */
    science.lin.tridag = function (a, b, c, d, x, n) {
      var i, m;
      for (i = 1; i < n; i++) {
        m = a[i] / b[i - 1];
        b[i] -= m * c[i - 1];
        d[i] -= m * d[i - 1];
      }
      x[n - 1] = d[n - 1] / b[n - 1];
      for (i = n - 2; i >= 0; i--) {
        x[i] = (d[i] - c[i] * x[i + 1]) / b[i];
      }
    };
  })(this);
  (function (exports) {
    science.stats = {};
    // Bandwidth selectors for Gaussian kernels.
    // Based on R's implementations in `stats.bw`.
    science.stats.bandwidth = {
      // Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
      nrd0: function (x) {
        var hi = Math.sqrt(science.stats.variance(x));
        if (!(lo = Math.min(hi, science.stats.iqr(x) / 1.34)))
          (lo = hi) || (lo = Math.abs(x[1])) || (lo = 1);
        return 0.9 * lo * Math.pow(x.length, -0.2);
      },

      // Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and
      // Visualization. Wiley.
      nrd: function (x) {
        var h = science.stats.iqr(x) / 1.34;
        return (
          1.06 *
          Math.min(Math.sqrt(science.stats.variance(x)), h) *
          Math.pow(x.length, -1 / 5)
        );
      },
    };
    science.stats.distance = {
      euclidean: function (a, b) {
        var n = a.length,
          i = -1,
          s = 0,
          x;
        while (++i < n) {
          x = a[i] - b[i];
          s += x * x;
        }
        return Math.sqrt(s);
      },
      manhattan: function (a, b) {
        var n = a.length,
          i = -1,
          s = 0;
        while (++i < n) s += Math.abs(a[i] - b[i]);
        return s;
      },
      minkowski: function (p) {
        return function (a, b) {
          var n = a.length,
            i = -1,
            s = 0;
          while (++i < n) s += Math.pow(Math.abs(a[i] - b[i]), p);
          return Math.pow(s, 1 / p);
        };
      },
      chebyshev: function (a, b) {
        var n = a.length,
          i = -1,
          max = 0,
          x;
        while (++i < n) {
          x = Math.abs(a[i] - b[i]);
          if (x > max) max = x;
        }
        return max;
      },
      hamming: function (a, b) {
        var n = a.length,
          i = -1,
          d = 0;
        while (++i < n) if (a[i] !== b[i]) d++;
        return d;
      },
      jaccard: function (a, b) {
        var n = a.length,
          i = -1,
          s = 0;
        while (++i < n) if (a[i] === b[i]) s++;
        return s / n;
      },
      braycurtis: function (a, b) {
        var n = a.length,
          i = -1,
          s0 = 0,
          s1 = 0,
          ai,
          bi;
        while (++i < n) {
          ai = a[i];
          bi = b[i];
          s0 += Math.abs(ai - bi);
          s1 += Math.abs(ai + bi);
        }
        return s0 / s1;
      },
    };
    // Based on implementation in http://picomath.org/.
    science.stats.erf = function (x) {
      var a1 = 0.254829592,
        a2 = -0.284496736,
        a3 = 1.421413741,
        a4 = -1.453152027,
        a5 = 1.061405429,
        p = 0.3275911;

      // Save the sign of x
      var sign = x < 0 ? -1 : 1;
      if (x < 0) {
        sign = -1;
        x = -x;
      }

      // A&S formula 7.1.26
      var t = 1 / (1 + p * x);
      return (
        sign *
        (1 -
          ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x))
      );
    };
    science.stats.phi = function (x) {
      return 0.5 * (1 + science.stats.erf(x / Math.SQRT2));
    };
    // See <http://en.wikipedia.org/wiki/Kernel_(statistics)>.
    science.stats.kernel = {
      uniform: function (u) {
        if (u <= 1 && u >= -1) return 0.5;
        return 0;
      },
      triangular: function (u) {
        if (u <= 1 && u >= -1) return 1 - Math.abs(u);
        return 0;
      },
      epanechnikov: function (u) {
        if (u <= 1 && u >= -1) return 0.75 * (1 - u * u);
        return 0;
      },
      quartic: function (u) {
        if (u <= 1 && u >= -1) {
          var tmp = 1 - u * u;
          return (15 / 16) * tmp * tmp;
        }
        return 0;
      },
      triweight: function (u) {
        if (u <= 1 && u >= -1) {
          var tmp = 1 - u * u;
          return (35 / 32) * tmp * tmp * tmp;
        }
        return 0;
      },
      gaussian: function (u) {
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
      },
      cosine: function (u) {
        if (u <= 1 && u >= -1)
          return (Math.PI / 4) * Math.cos((Math.PI / 2) * u);
        return 0;
      },
    };
    // http://exploringdata.net/den_trac.htm
    science.stats.kde = function () {
      var kernel = science.stats.kernel.gaussian,
        sample = [],
        bandwidth = science.stats.bandwidth.nrd;

      function kde(points, i) {
        var bw = bandwidth.call(this, sample);
        return points.map(function (x) {
          var i = -1,
            y = 0,
            n = sample.length;
          while (++i < n) {
            y += kernel((x - sample[i]) / bw);
          }
          return [x, y / bw / n];
        });
      }

      kde.kernel = function (x) {
        if (!arguments.length) return kernel;
        kernel = x;
        return kde;
      };

      kde.sample = function (x) {
        if (!arguments.length) return sample;
        sample = x;
        return kde;
      };

      kde.bandwidth = function (x) {
        if (!arguments.length) return bandwidth;
        bandwidth = science.functor(x);
        return kde;
      };

      return kde;
    };
    // Based on figue implementation by Jean-Yves Delort.
    // http://code.google.com/p/figue/
    science.stats.kmeans = function () {
      var distance = science.stats.distance.euclidean,
        maxIterations = 1000,
        k = 1;

      function kmeans(vectors) {
        var n = vectors.length,
          assignments = [],
          clusterSizes = [],
          repeat = 1,
          iterations = 0,
          centroids = science_stats_kmeansRandom(k, vectors),
          newCentroids,
          i,
          j,
          x,
          d,
          min,
          best;

        while (repeat && iterations < maxIterations) {
          // Assignment step.
          j = -1;
          while (++j < k) {
            clusterSizes[j] = 0;
          }

          i = -1;
          while (++i < n) {
            x = vectors[i];
            min = Infinity;
            j = -1;
            while (++j < k) {
              d = distance.call(this, centroids[j], x);
              if (d < min) {
                min = d;
                best = j;
              }
            }
            clusterSizes[(assignments[i] = best)]++;
          }

          // Update centroids step.
          newCentroids = [];
          i = -1;
          while (++i < n) {
            x = assignments[i];
            d = newCentroids[x];
            if (d == null) newCentroids[x] = vectors[i].slice();
            else {
              j = -1;
              while (++j < d.length) {
                d[j] += vectors[i][j];
              }
            }
          }
          j = -1;
          while (++j < k) {
            x = newCentroids[j];
            d = 1 / clusterSizes[j];
            i = -1;
            while (++i < x.length) x[i] *= d;
          }

          // Check convergence.
          repeat = 0;
          j = -1;
          while (++j < k) {
            if (!science_stats_kmeansCompare(newCentroids[j], centroids[j])) {
              repeat = 1;
              break;
            }
          }
          centroids = newCentroids;
          iterations++;
        }
        return { assignments: assignments, centroids: centroids };
      }

      kmeans.k = function (x) {
        if (!arguments.length) return k;
        k = x;
        return kmeans;
      };

      kmeans.distance = function (x) {
        if (!arguments.length) return distance;
        distance = x;
        return kmeans;
      };

      return kmeans;
    };

    function science_stats_kmeansCompare(a, b) {
      if (!a || !b || a.length !== b.length) return false;
      var n = a.length,
        i = -1;
      while (++i < n) if (a[i] !== b[i]) return false;
      return true;
    }

    // Returns an array of k distinct vectors randomly selected from the input
    // array of vectors. Returns null if k > n or if there are less than k distinct
    // objects in vectors.
    function science_stats_kmeansRandom(k, vectors) {
      var n = vectors.length;
      if (k > n) return null;

      var selected_vectors = [];
      var selected_indices = [];
      var tested_indices = {};
      var tested = 0;
      var selected = 0;
      var i, vector, select;

      while (selected < k) {
        if (tested === n) return null;

        var random_index = Math.floor(Math.random() * n);
        if (random_index in tested_indices) continue;

        tested_indices[random_index] = 1;
        tested++;
        vector = vectors[random_index];
        select = true;
        for (i = 0; i < selected; i++) {
          if (science_stats_kmeansCompare(vector, selected_vectors[i])) {
            select = false;
            break;
          }
        }
        if (select) {
          selected_vectors[selected] = vector;
          selected_indices[selected] = random_index;
          selected++;
        }
      }
      return selected_vectors;
    }
    science.stats.hcluster = function () {
      var distance = science.stats.distance.euclidean,
        linkage = "single"; // single, complete or average

      function hcluster(vectors) {
        var n = vectors.length,
          dMin = [],
          cSize = [],
          distMatrix = [],
          clusters = [],
          c1,
          c2,
          c1Cluster,
          c2Cluster,
          p,
          root,
          i,
          j;

        // Initialise distance matrix and vector of closest clusters.
        i = -1;
        while (++i < n) {
          dMin[i] = 0;
          distMatrix[i] = [];
          j = -1;
          while (++j < n) {
            distMatrix[i][j] =
              i === j ? Infinity : distance(vectors[i], vectors[j]);
            if (distMatrix[i][dMin[i]] > distMatrix[i][j]) dMin[i] = j;
          }
        }

        // create leaves of the tree
        i = -1;
        while (++i < n) {
          clusters[i] = [];
          clusters[i][0] = {
            left: null,
            right: null,
            dist: 0,
            centroid: vectors[i],
            size: 1,
            depth: 0,
          };
          cSize[i] = 1;
        }

        // Main loop
        for (p = 0; p < n - 1; p++) {
          // find the closest pair of clusters
          c1 = 0;
          for (i = 0; i < n; i++) {
            if (distMatrix[i][dMin[i]] < distMatrix[c1][dMin[c1]]) c1 = i;
          }
          c2 = dMin[c1];

          // create node to store cluster info
          c1Cluster = clusters[c1][0];
          c2Cluster = clusters[c2][0];

          var newCluster = {
            left: c1Cluster,
            right: c2Cluster,
            dist: distMatrix[c1][c2],
            centroid: calculateCentroid(
              c1Cluster.size,
              c1Cluster.centroid,
              c2Cluster.size,
              c2Cluster.centroid
            ),
            size: c1Cluster.size + c2Cluster.size,
            depth: 1 + Math.max(c1Cluster.depth, c2Cluster.depth),
          };
          clusters[c1].splice(0, 0, newCluster);
          cSize[c1] += cSize[c2];

          // overwrite row c1 with respect to the linkage type
          for (j = 0; j < n; j++) {
            switch (linkage) {
              case "single":
                if (distMatrix[c1][j] > distMatrix[c2][j])
                  distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                break;
              case "complete":
                if (distMatrix[c1][j] < distMatrix[c2][j])
                  distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                break;
              case "average":
                distMatrix[j][c1] = distMatrix[c1][j] =
                  (cSize[c1] * distMatrix[c1][j] +
                    cSize[c2] * distMatrix[c2][j]) /
                  (cSize[c1] + cSize[j]);
                break;
            }
          }
          distMatrix[c1][c1] = Infinity;

          // infinity ­out old row c2 and column c2
          for (i = 0; i < n; i++)
            distMatrix[i][c2] = distMatrix[c2][i] = Infinity;

          // update dmin and replace ones that previous pointed to c2 to point to c1
          for (j = 0; j < n; j++) {
            if (dMin[j] == c2) dMin[j] = c1;
            if (distMatrix[c1][j] < distMatrix[c1][dMin[c1]]) dMin[c1] = j;
          }

          // keep track of the last added cluster
          root = newCluster;
        }

        return root;
      }

      hcluster.distance = function (x) {
        if (!arguments.length) return distance;
        distance = x;
        return hcluster;
      };

      return hcluster;
    };

    function calculateCentroid(c1Size, c1Centroid, c2Size, c2Centroid) {
      var newCentroid = [],
        newSize = c1Size + c2Size,
        n = c1Centroid.length,
        i = -1;
      while (++i < n) {
        newCentroid[i] =
          (c1Size * c1Centroid[i] + c2Size * c2Centroid[i]) / newSize;
      }
      return newCentroid;
    }
    science.stats.iqr = function (x) {
      var quartiles = science.stats.quantiles(x, [0.25, 0.75]);
      return quartiles[1] - quartiles[0];
    };
    // Based on org.apache.commons.math.analysis.interpolation.LoessInterpolator
    // from http://commons.apache.org/math/
    science.stats.loess = function () {
      var bandwidth = 0.3,
        robustnessIters = 2,
        accuracy = 1e-12;

      function smooth(xval, yval, weights) {
        var n = xval.length,
          i;

        if (n !== yval.length) throw { error: "Mismatched array lengths" };
        if (n == 0) throw { error: "At least one point required." };

        if (arguments.length < 3) {
          weights = [];
          i = -1;
          while (++i < n) weights[i] = 1;
        }

        science_stats_loessFiniteReal(xval);
        science_stats_loessFiniteReal(yval);
        science_stats_loessFiniteReal(weights);
        science_stats_loessStrictlyIncreasing(xval);

        if (n == 1) return [yval[0]];
        if (n == 2) return [yval[0], yval[1]];

        var bandwidthInPoints = Math.floor(bandwidth * n);

        if (bandwidthInPoints < 2) throw { error: "Bandwidth too small." };

        var res = [],
          residuals = [],
          robustnessWeights = [];

        // Do an initial fit and 'robustnessIters' robustness iterations.
        // This is equivalent to doing 'robustnessIters+1' robustness iterations
        // starting with all robustness weights set to 1.
        i = -1;
        while (++i < n) {
          res[i] = 0;
          residuals[i] = 0;
          robustnessWeights[i] = 1;
        }

        var iter = -1;
        while (++iter <= robustnessIters) {
          var bandwidthInterval = [0, bandwidthInPoints - 1];
          // At each x, compute a local weighted linear regression
          var x;
          i = -1;
          while (++i < n) {
            x = xval[i];

            // Find out the interval of source points on which
            // a regression is to be made.
            if (i > 0) {
              science_stats_loessUpdateBandwidthInterval(
                xval,
                weights,
                i,
                bandwidthInterval
              );
            }

            var ileft = bandwidthInterval[0],
              iright = bandwidthInterval[1];

            // Compute the point of the bandwidth interval that is
            // farthest from x
            var edge =
              xval[i] - xval[ileft] > xval[iright] - xval[i] ? ileft : iright;

            // Compute a least-squares linear fit weighted by
            // the product of robustness weights and the tricube
            // weight function.
            // See http://en.wikipedia.org/wiki/Linear_regression
            // (section "Univariate linear case")
            // and http://en.wikipedia.org/wiki/Weighted_least_squares
            // (section "Weighted least squares")
            var sumWeights = 0,
              sumX = 0,
              sumXSquared = 0,
              sumY = 0,
              sumXY = 0,
              denom = Math.abs(1 / (xval[edge] - x));

            for (var k = ileft; k <= iright; ++k) {
              var xk = xval[k],
                yk = yval[k],
                dist = k < i ? x - xk : xk - x,
                w =
                  science_stats_loessTricube(dist * denom) *
                  robustnessWeights[k] *
                  weights[k],
                xkw = xk * w;
              sumWeights += w;
              sumX += xkw;
              sumXSquared += xk * xkw;
              sumY += yk * w;
              sumXY += yk * xkw;
            }

            var meanX = sumX / sumWeights,
              meanY = sumY / sumWeights,
              meanXY = sumXY / sumWeights,
              meanXSquared = sumXSquared / sumWeights;

            var beta =
              Math.sqrt(Math.abs(meanXSquared - meanX * meanX)) < accuracy
                ? 0
                : (meanXY - meanX * meanY) / (meanXSquared - meanX * meanX);

            var alpha = meanY - beta * meanX;

            res[i] = beta * x + alpha;
            residuals[i] = Math.abs(yval[i] - res[i]);
          }

          // No need to recompute the robustness weights at the last
          // iteration, they won't be needed anymore
          if (iter === robustnessIters) {
            break;
          }

          // Recompute the robustness weights.

          // Find the median residual.
          var medianResidual = science.stats.median(residuals);

          if (Math.abs(medianResidual) < accuracy) break;

          var arg, w;
          i = -1;
          while (++i < n) {
            arg = residuals[i] / (6 * medianResidual);
            robustnessWeights[i] = arg >= 1 ? 0 : (w = 1 - arg * arg) * w;
          }
        }

        return res;
      }

      smooth.bandwidth = function (x) {
        if (!arguments.length) return x;
        bandwidth = x;
        return smooth;
      };

      smooth.robustnessIterations = function (x) {
        if (!arguments.length) return x;
        robustnessIters = x;
        return smooth;
      };

      smooth.accuracy = function (x) {
        if (!arguments.length) return x;
        accuracy = x;
        return smooth;
      };

      return smooth;
    };

    function science_stats_loessFiniteReal(values) {
      var n = values.length,
        i = -1;

      while (++i < n) if (!isFinite(values[i])) return false;

      return true;
    }

    function science_stats_loessStrictlyIncreasing(xval) {
      var n = xval.length,
        i = 0;

      while (++i < n) if (xval[i - 1] >= xval[i]) return false;

      return true;
    }

    // Compute the tricube weight function.
    // http://en.wikipedia.org/wiki/Local_regression#Weight_function
    function science_stats_loessTricube(x) {
      return (x = 1 - x * x * x) * x * x;
    }

    // Given an index interval into xval that embraces a certain number of
    // points closest to xval[i-1], update the interval so that it embraces
    // the same number of points closest to xval[i], ignoring zero weights.
    function science_stats_loessUpdateBandwidthInterval(
      xval,
      weights,
      i,
      bandwidthInterval
    ) {
      var left = bandwidthInterval[0],
        right = bandwidthInterval[1];

      // The right edge should be adjusted if the next point to the right
      // is closer to xval[i] than the leftmost point of the current interval
      var nextRight = science_stats_loessNextNonzero(weights, right);
      if (
        nextRight < xval.length &&
        xval[nextRight] - xval[i] < xval[i] - xval[left]
      ) {
        var nextLeft = science_stats_loessNextNonzero(weights, left);
        bandwidthInterval[0] = nextLeft;
        bandwidthInterval[1] = nextRight;
      }
    }

    function science_stats_loessNextNonzero(weights, i) {
      var j = i + 1;
      while (j < weights.length && weights[j] === 0) j++;
      return j;
    }
    // Welford's algorithm.
    science.stats.mean = function (x) {
      var n = x.length;
      if (n === 0) return NaN;
      var m = 0,
        i = -1;
      while (++i < n) m += (x[i] - m) / (i + 1);
      return m;
    };
    science.stats.median = function (x) {
      return science.stats.quantiles(x, [0.5])[0];
    };
    science.stats.mode = function (x) {
      var counts = {},
        mode = [],
        max = 0,
        n = x.length,
        i = -1,
        d,
        k;
      while (++i < n) {
        k = counts.hasOwnProperty((d = x[i])) ? ++counts[d] : (counts[d] = 1);
        if (k === max) mode.push(d);
        else if (k > max) {
          max = k;
          mode = [d];
        }
      }
      if (mode.length === 1) return mode[0];
    };
    // Uses R's quantile algorithm type=7.
    science.stats.quantiles = function (d, quantiles) {
      d = d.slice().sort(science.ascending);
      var n_1 = d.length - 1;
      return quantiles.map(function (q) {
        if (q === 0) return d[0];
        else if (q === 1) return d[n_1];

        var index = 1 + q * n_1,
          lo = Math.floor(index),
          h = index - lo,
          a = d[lo - 1];

        return h === 0 ? a : a + h * (d[lo] - a);
      });
    };
    // Unbiased estimate of a sample's variance.
    // Also known as the sample variance, where the denominator is n - 1.
    science.stats.variance = function (x) {
      var n = x.length;
      if (n < 1) return NaN;
      if (n === 1) return 0;
      var mean = science.stats.mean(x),
        i = -1,
        s = 0;
      while (++i < n) {
        var v = x[i] - mean;
        s += v * v;
      }
      return s / (n - 1);
    };
    science.stats.distribution = {};
    // From http://www.colingodsey.com/javascript-gaussian-random-number-generator/
    // Uses the Box-Muller Transform.
    science.stats.distribution.gaussian = function () {
      var random = Math.random,
        mean = 0,
        sigma = 1,
        variance = 1;

      function gaussian() {
        var x1, x2, rad, y1;

        do {
          x1 = 2 * random() - 1;
          x2 = 2 * random() - 1;
          rad = x1 * x1 + x2 * x2;
        } while (rad >= 1 || rad === 0);

        return mean + sigma * x1 * Math.sqrt((-2 * Math.log(rad)) / rad);
      }

      gaussian.pdf = function (x) {
        x = (x - mean) / sigma;
        return (
          (science_stats_distribution_gaussianConstant *
            Math.exp(-0.5 * x * x)) /
          sigma
        );
      };

      gaussian.cdf = function (x) {
        x = (x - mean) / sigma;
        return 0.5 * (1 + science.stats.erf(x / Math.SQRT2));
      };

      gaussian.mean = function (x) {
        if (!arguments.length) return mean;
        mean = +x;
        return gaussian;
      };

      gaussian.variance = function (x) {
        if (!arguments.length) return variance;
        sigma = Math.sqrt((variance = +x));
        return gaussian;
      };

      gaussian.random = function (x) {
        if (!arguments.length) return random;
        random = x;
        return gaussian;
      };

      return gaussian;
    };

    science_stats_distribution_gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
  })(this);
})(this);
