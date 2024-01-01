import { app } from "../../scripts/app.js";

const css = `
@media screen and (max-width: 768px) {
  .graphdialog.rounded {
    box-sizing: border-box;
    width: calc(100vw - 20px);
    left: 10px !important;
    transform: none !important;
  }
  .graphdialog.rounded * {
    transform: none !important;
  }
  .graphdialog.rounded input {
    flex: 1;
  }
  .comfy-menu {
    box-sizing: border-box;
    top: auto !important;
    bottom: -282px !important;
    width: 100vw;
    border-radius: 8px 8px 0 0;
  }
  .comfy-menu::after {
    content: "";
    display: block;
    position: absolute;
    bottom: 0;
    width: 100vw;
    height: 280px;
  }
  .comfy-menu.show {
    bottom: 0 !important;
    transition: bottom 0.5s;
  }
  .comfy-menu.show::after {
    height: 0;
    transition: height 0.5s cubic-bezier(1, 0, 1, 0);
  }
  .comfy-menu-btns button {
    font-size: 18px;
  }

  .litegraph.litecontextmenu.litemenubar-panel {
    box-sizing: border-box;
    width: calc(100vw - 20px);
    left: 10px !important;
    top: 60px !important;
    transform: none !important;
    max-height: 80vh;
    overflow: auto;
    padding: 1em 0.5em;
    border-radius: 8px;
  }
  .litegraph.litecontextmenu.litemenubar-panel * {
    transform: none !important;
  }
  .litegraph .litemenu-entry,
  .litemenu-title {
    font-size: 16px;
  }
  .comfy-multiline-input:focus {
    top: 60px !important;
    left: 10px !important;
    box-sizing: border-box !important;
    width: calc(100vw - 20px) !important;
    padding: 0.5em !important;
    min-height: 7em !important;
    height: auto !important;
    font-size: 16px !important;
    transform: none !important;
  }
}

`;

const ext = {
  name: "Mobile",
  async setup() {
    if (window.innerWidth <= 768) {
      // 设置移动端友好的css
      var style = document.createElement("style");
      style.innerHTML = css;
      document.head.appendChild(style);
      let menu = document.getElementsByClassName("comfy-menu")[0];
      document.addEventListener("click", function () {
        menu.className = menu.className
          .split(" ")
          .filter((f) => f != "show")
          .join(" ");
      });
      menu.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.className =
          menu.className
            .split(" ")
            .filter((f) => f != "show")
            .join(" ") + " show";
        console.log(menu.className);
      });
      document
        .getElementById("queue-button")
        .addEventListener("click", function (e) {
          e.stopPropagation();
        });
      // 设置移动端默认缩放
      app.canvas.ds.scale = 1.25;
      // 取消节点搜索功能
      app.canvas.allow_searchbox = false;
      // 给节点的输入和输出绑定点击事件，点击时将可连续的节点移动到附近
      for (let node of app.graph._nodes) {
        if (node.inputs && node.inputs.length) {
          node.onInputClick = (i, e) => {
            console.log(i, e);
            let x = e.canvasX;
            let y = e.canvasY;
            let input = node.inputs[i];
            let outputNodes = app.graph._nodes.filter(
              (f) =>
                f.id != node.id &&
                f.outputs &&
                f.outputs.length &&
                f.outputs.findIndex((_f) =>
                  LiteGraph.isValidConnection(_f.type, input.type)
                ) != -1
            );
            let h = 0;
            outputNodes.forEach((node) => {
              h +=
                LiteGraph.NODE_TITLE_HEIGHT +
                node.outputs.length * LiteGraph.NODE_SLOT_HEIGHT +
                30;
            });
            let startY = y - h / 2;
            outputNodes.forEach((node) => {
              node.is_selected = true;
              node._lastPos = node.pos;
              node.pos = [x - 50 - node.size[0], startY];
              startY +=
                LiteGraph.NODE_TITLE_HEIGHT +
                node.outputs.length * LiteGraph.NODE_SLOT_HEIGHT +
                30;
            });
            zindex = window
              .getComputedStyle(app.canvas.canvas)
              .getPropertyValue("z-index");
            app.canvas.canvas.style.zIndex = "999";
            app.canvas.canvas.style.position = "relative";
          };
        } else if (node.outputs && node.outputs.length) {
          node.onOutputClick = (i, e) => {
            let x = e.canvasX;
            let y = e.canvasY;
            let output = node.outputs[i];
            let inputNodes = app.graph._nodes.filter(
              (f) =>
                f.id != node.id &&
                f.inputs &&
                f.inputs.length &&
                f.inputs.findIndex((_f) =>
                  LiteGraph.isValidConnection(output.type, _f.type)
                ) != -1
            );
            let h = 0;
            inputNodes.forEach((node) => {
              h +=
                LiteGraph.NODE_TITLE_HEIGHT +
                node.outputs.length * LiteGraph.NODE_SLOT_HEIGHT +
                30;
            });
            let startY = y - h / 2;
            inputNodes.forEach((node) => {
              node.is_selected = true;
              node._lastPos = node.pos;
              node.pos = [x + 50, startY];
              startY +=
                LiteGraph.NODE_TITLE_HEIGHT +
                node.outputs.length * LiteGraph.NODE_SLOT_HEIGHT +
                30;
            });

            zindex = window
              .getComputedStyle(app.canvas.canvas)
              .getPropertyValue("z-index");
            app.canvas.canvas.style.zIndex = "999";
            app.canvas.canvas.style.position = "relative";
          };
        }
      }

      // 获取默认css属性
      let zindex = window
        .getComputedStyle(app.canvas.canvas)
        .getPropertyValue("z-index");
      let position = window
        .getComputedStyle(app.canvas.canvas)
        .getPropertyValue("position");
      // 手势缩放
      let center = { x: 0, y: 0 };
      let startPos = { x: 0, y: 0 };
      let startMouse = { x: 0, y: 0 };
      let startLen = 0;
      let scale = 1;
      let longTouch = setTimeout(() => {}, 600);
      const event = {
        touchend: function (event) {
          // 更新缩放比例
          event.stopPropagation();
          clearTimeout(longTouch);
          app.canvas.ds.dragging = false;
          if (!event.targetTouches.length) {
          }
        },
        touchstart: function (event) {
          event.stopPropagation();
          if (event.targetTouches.length == 1) {
            startPos = {
              x: event.targetTouches[0].screenX,
              y: event.targetTouches[0].screenY,
            };
            scale = app.canvas.ds.scale;
            startMouse = {
              x: event.targetTouches[0].clientX,
              y: event.targetTouches[0].clientY,
            };
          }
          if (event.targetTouches[1]) {
            clearTimeout(longTouch);
            center = {
              x: (event.targetTouches[1].screenX - startPos.x) / 2,
              y: (event.targetTouches[1].screenY - startPos.y) / 2,
            };
            let pos = {
              x: event.targetTouches[1].screenX,
              y: event.targetTouches[1].screenY,
            };
            startLen = Math.sqrt(
              Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
            );
          }
        },
        touchmove: function (event) {
          event.stopPropagation();
          event.preventDefault();
          clearTimeout(longTouch);
          if (event.targetTouches[1]) {
            let pos = {
              x: event.targetTouches[1].screenX,
              y: event.targetTouches[1].screenY,
            };
            let len = Math.sqrt(
              Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
            );
            let toScale = scale * (len / startLen);
            if (
              !isNaN(toScale) &&
              toScale >= app.canvas.ds.min_scale &&
              toScale <= app.canvas.ds.max_scale
            ) {
              app.canvas.ds.changeScale(toScale, [center.x, center.y]);
            }
          }
        },
        restorePos(e) {
          e.stopPropagation();
          clearTimeout(longTouch);
          setTimeout(() => {
            app.graph._nodes.forEach((node) => {
              if (node._lastPos) {
                node.pos = node._lastPos;
                node._lastPos = undefined;
                node.is_selected = false;
              }
            });
            app.canvas.canvas.style.zIndex = zindex;
            app.canvas.canvas.style.position = position;
            app.canvas.setDirty(true, true); // 触发渲染
          }, 200);
        },
      };
      // 长按显示菜单
      function longTouchAction(pos, e) {
        e.stopPropagation();
        e.preventDefault();
        var node = app.graph.getNodeOnPos(
          pos.x,
          pos.y,
          app.graph.visible_nodes,
          5
        );
        app.canvas.processContextMenu(node, e);
      }
      function showImage() {}
      LiteGraph.pointerListenerAdd(
        app.canvas.canvas,
        "down",
        function (e) {
          e.stopPropagation();
          clearTimeout(longTouch);
          longTouch = setTimeout(() => {
            longTouchAction({ x: e.canvasX, y: e.canvasY }, e);
          }, 600);
        },
        true
      );
      LiteGraph.pointerListenerAdd(document, "up", event.restorePos, true);
      app.canvas.canvas.addEventListener("touchend", event.touchend);
      app.canvas.canvas.addEventListener("touchstart", event.touchstart);
      app.canvas.canvas.addEventListener("touchmove", event.touchmove);
    }
  },
};
app.registerExtension(ext);
