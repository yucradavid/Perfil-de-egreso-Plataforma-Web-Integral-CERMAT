/*
mkdocs-print-site-plugin builds the "Tabla de contenidos" page by cloning
the list from Material's secondary sidebar (.md-sidebar--secondary), with
a fallback to #toc-collapse. Neither exists when the theme feature
toc.integrate is enabled, so its generate_toc() silently fails and the
print page's table of contents renders empty.

This overrides generate_toc() with a version that builds the list
directly from the real headings already present in the combined print
page, independent of which sidebar/toc theme features are enabled.
*/
function generate_toc() {
  var container = document.querySelector("#print-page-toc nav");
  var root = document.getElementById("print-site-page");
  if (!container || !root) return;

  var headings = root.querySelectorAll(
    "section.print-page h1[id], section.print-page h2[id], section.print-page h3[id]"
  );
  if (!headings.length) return;

  function headingText(h) {
    var clone = h.cloneNode(true);
    var link = clone.querySelector(".headerlink");
    if (link) link.remove();
    return clone.textContent.trim();
  }

  var rootUl = document.createElement("ul");
  var stack = [{ level: 0, ul: rootUl }];

  headings.forEach(function (h) {
    var level = parseInt(h.tagName.substring(1), 10);

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    var li = document.createElement("li");
    var a = document.createElement("a");
    a.setAttribute("href", "#" + h.id);
    a.textContent = headingText(h);
    li.appendChild(a);
    stack[stack.length - 1].ul.appendChild(li);

    var childUl = document.createElement("ul");
    li.appendChild(childUl);
    stack.push({ level: level, ul: childUl });
  });

  container.appendChild(rootUl);
}
