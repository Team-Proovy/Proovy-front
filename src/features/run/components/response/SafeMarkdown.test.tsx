import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeMarkdown } from "./SafeMarkdown";
import { normalizeMathDelimiters } from "./safe_markdown_syntax";

const renderBody = (body: string, sourceLabels?: Map<string, string>) =>
  render(
    <SafeMarkdown
      body={body}
      sourceLabels={sourceLabels}
    />,
  ).container;

describe("SafeMarkdown 비렌더 항목", () => {
  it.each([
    ["script", "<script>alert(1)</script>", "script"],
    ["img onerror", '<img src="x" onerror="alert(1)">', "img"],
    ["iframe", '<iframe src="https://evil.example"></iframe>', "iframe"],
    ["embed", '<embed src="https://evil.example/a.swf">', "embed"],
    ["object", '<object data="https://evil.example/x"></object>', "object"],
    ["style", "<style>body{display:none}</style>", "style"],
    ["svg", '<svg onload="alert(1)"></svg>', "svg"],
  ])("raw HTML(%s)을 요소가 아닌 텍스트로만 보인다", (_, html, tag) => {
    const container = renderBody(`앞 ${html} 뒤`);

    expect(container.querySelector(tag)).toBeNull();
    expect(container).toHaveTextContent(html);
  });

  it("블록 HTML도 텍스트로만 보인다", () => {
    const container = renderBody(
      '<div onclick="alert(1)">\n<iframe src="https://evil.example"></iframe>\n</div>',
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("[onclick]")).toBeNull();
    expect(container).toHaveTextContent('<div onclick="alert(1)">');
  });

  it("외부 이미지 embed는 이미지로 그리지 않는다", () => {
    const container = renderBody(
      "그림 ![추적](https://evil.example/pixel.png) 끝",
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent(
      "![추적](https://evil.example/pixel.png)",
    );
  });

  it("참조 정의를 통한 이미지·링크도 텍스트로 남긴다", () => {
    const container = renderBody(
      "![x][pic] 그리고 [y][site]\n\n[pic]: https://evil.example/a.png\n[site]: javascript:alert(1)",
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container).toHaveTextContent("[site]: javascript:alert(1)");
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("script·위험 URL(%s) 링크를 만들지 않는다", (url) => {
    const container = renderBody(`[누르기](${url})`);

    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toMatch(/href=/);
  });

  it("http(s) 링크는 새 창·noopener로 연다", () => {
    renderBody("[자료](https://proovy.example/doc)");

    const link = screen.getByRole("link", { name: "자료" });
    expect(link).toHaveAttribute("href", "https://proovy.example/doc");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});

describe("SafeMarkdown 허용 항목", () => {
  it("문단·목록·강조·표를 그린다", () => {
    const container = renderBody(
      "**굵게** 와 *기울임*\n\n- 하나\n- 둘\n\n| a | b |\n| - | - |\n| 1 | 2 |",
    );

    expect(container.querySelector("strong")).toHaveTextContent("굵게");
    expect(container.querySelector("em")).toHaveTextContent("기울임");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("table")).not.toBeNull();
  });

  it.each([
    ["$…$", "인수분해하면 $(x-2)(x-3)=0$이다."],
    ["$$…$$", "$$\\frac{1}{2}$$"],
    ["\\(…\\)", "값은 \\(x^2\\)이다."],
    ["\\[…\\]", "\\[\n\\int_0^1 x\\,dx\n\\]"],
  ])("KaTeX 수식(%s)을 그린다", (_, body) => {
    const container = renderBody(body);

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector(".katex-error")).toBeNull();
  });

  it("수식 안의 <·> 비교를 HTML로 보지 않는다", () => {
    const container = renderBody("$a<b>c$ 이다");

    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector("b")).toBeNull();
  });

  it("KaTeX \\href로 script URL 링크를 만들지 않는다", () => {
    const container = renderBody("$\\href{javascript:alert(1)}{x}$");

    expect(container.querySelector("a")).toBeNull();
  });

  it("\\r이 섞인 본문을 줄바꿈으로 읽는다", () => {
    const container = renderBody("첫 줄\r\n\r\n- 하나\r- 둘\r\r$x+1$");

    expect(container.querySelectorAll("p").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.innerHTML).not.toContain("\r");
  });

  it("escape한 \\$는 수식이 아닌 달러 기호다", () => {
    const container = renderBody("가격은 \\$5 이다");

    expect(container.querySelector(".katex")).toBeNull();
    expect(container).toHaveTextContent("가격은 $5 이다");
  });
});

describe("SafeMarkdown source marker", () => {
  const labels = new Map([["sref-1", "개념 노트 3–4쪽"]]);

  it("marker를 snapshot label 텍스트로만 바꾼다", () => {
    const container = renderBody("답이다.[[source:sref-1]]", labels);

    const marker = container.querySelector("[data-source-marker]");
    expect(marker).toHaveTextContent("개념 노트 3–4쪽");
    expect(marker?.tagName).toBe("SPAN");
    expect(container.querySelector("a, button")).toBeNull();
    expect(container).not.toHaveTextContent("[[source:");
  });

  it("catalog에 없는 marker는 id를 보이지 않고 지운다", () => {
    const container = renderBody("답이다.[[source:missing-1]]", labels);

    expect(container.querySelector("[data-source-marker]")).toBeNull();
    expect(container).not.toHaveTextContent("missing-1");
  });
});

describe("normalizeMathDelimiters", () => {
  it("\\(·\\[ 구분자를 $·$$로 맞추고 닫히지 않은 opener는 그대로 둔다", () => {
    expect(normalizeMathDelimiters("a \\(x\\) b \\[y\\]")).toBe(
      "a $x$ b $$y$$",
    );
    expect(normalizeMathDelimiters("가격 \\$5, 열림 \\(x")).toBe(
      "가격 \\$5, 열림 \\(x",
    );
  });
});
