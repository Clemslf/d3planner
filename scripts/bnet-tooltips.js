(function() {
  var _L = DiabloCalc.locale("bnet-tooltips.js");

  DiabloCalc.tooltip = new function() {
    var tooltipWrapper;
    var tooltipContent;
    var tooltipBody;
    var side_tooltipWrapper;
    var side_tooltipContent;
    var curNode;
    var curCompare;
    var enabled = true;
    var shiftKey = false, altKey = false;

    function initialize() {
      if (!tooltipBody) {
        tooltipBody = $("<div class=\"tooltip-body\"></div>");
        $("body").append(tooltipBody);
      }
      tooltipWrapper = $("<div></div>").addClass("d3-tooltip-wrapper").hide();
      tooltipContent = $("<div></div>");
      $(tooltipBody).append(tooltipWrapper.append(tooltipContent));
    }
    function side_initialize() {
      if (!tooltipBody) {
        tooltipBody = $("<div class=\"tooltip-body\"></div>");
        $("body").append(tooltipBody);
      }
      side_tooltipWrapper = $("<div></div>").addClass("d3-tooltip-wrapper").hide();
      side_tooltipContent = $("<div></div>");
      $(tooltipBody).append(side_tooltipWrapper.append(side_tooltipContent));
    }

    var tipRect, tipSide;
    function tipScroll(evt) {
      if (!tipRect || !enabled) {
        return;
      }
      var wnd = $(window);
      var wndRect = {
        left: 5, top: 5,
        right: wnd.width() - 5, bottom: wnd.height() - 5,
      };
      var oldLeft = tipRect.left;
      var oldTop = tipRect.top;
      var width = tipRect.right - tipRect.left;
      var height = tipRect.bottom - tipRect.top;
      var clipped = false;
      function clipBy(val, min, max) {
        if (val < min) {
          val = min;
          clipped = true;
        }
        if (val > max) {
          val = max;
          clipped = true;
        }
        return val;
      }
      if (width > wndRect.right - wndRect.left) {
        tipRect.left = clipBy(tipRect.left + evt.deltaX * evt.deltaFactor,
          wndRect.right - width, wndRect.left);
        tipRect.right = tipRect.left + width;
      }
      if (height > wndRect.bottom - wndRect.top) {
        tipRect.top = clipBy(tipRect.top + evt.deltaY * evt.deltaFactor,
          wndRect.bottom - height, wndRect.top);
        tipRect.bottom = tipRect.top + height;
      }
      tooltipWrapper.css({left: tipRect.left, top: tipRect.top, visibility: "visible"});
      if (!clipped) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }

    function show(node, ox, oy, _side) {
      if (!_side) {
        side_hide();
      }
      if (curNode) {
        $(curNode).unmousewheel(tipScroll);
      }
      curNode = node;
      clearTimeout(loadingTimeout);
      if(tooltipWrapper == null) {
        initialize();
      }

      tooltipWrapper.css({left: 0, top: 0, visibility: "hidden"}).show();

      node = $(node);
      var wnd = $(window);
      var offset = node.offset();
      var rect = {
        left: offset.left - wnd.scrollLeft(),
        top: offset.top - wnd.scrollTop(),
      };
      rect.right = rect.left + node.outerWidth();
      rect.bottom = rect.top + node.outerHeight();
      var wndRect = {
        left: 50, top: 5,
        right: wnd.width() - 50, bottom: wnd.height() - 5,
      };

      var order = ["right", "left", "top", "bottom"];
      if (typeof ox === "string") {
        var idx = order.indexOf(ox);
        if (idx > 0) {
          order[idx] = order[0];
          order[0] = ox;
        }
        ox = undefined;
      }

      if (ox !== undefined) {
        rect.left = rect.right = rect.left + ox;
      }
      if (oy !== undefined) {
        rect.top = rect.bottom = rect.top + oy;
      }

      if (ox === undefined && oy === undefined && window.touchEvent && window.touchEvent.touches.length) {
        rect.left = window.touchEvent.touches[0].pageX - wnd.scrollLeft() - 30;
        rect.top = window.touchEvent.touches[0].pageY - wnd.scrollTop() - 20;
        rect.right = rect.left + 60;
        rect.bottom = rect.top + 40;
      }

      var padX = Math.max(5, 20 - (rect.right - rect.left));
      var padY = 25;

      var x, y;
      var tipWidth = tooltipWrapper.outerWidth();
      var tipHeight = tooltipWrapper.outerHeight();

      if (_side) {
        wndRect.left += tipWidth - 40;
        wndRect.right -= tipWidth - 40;
      }

      var horzY = Math.max(wndRect.top, rect.top - tipHeight);
      var vertX = (rect.left + rect.right - tipWidth) / 2;
      vertX = Math.min(vertX, wndRect.right - tipWidth);
      vertX = Math.max(vertX, wndRect.left);

      var x, y;
      for (var i = 0; i < order.length; ++order) {
        if (order[i] === "right") {
          if (rect.right + padX + tipWidth <= wndRect.right) {
            x = rect.right + padX;
            y = horzY;
            tipSide = "right";
            break;
          }
        } else if (order[i] === "left") {
          if (rect.left - padX - tipWidth >= wndRect.left) {
            x = rect.left - padX - tipWidth;
            y = horzY;
            tipSide = "left";
            break;
          }
        } else if (order[i] === "top") {
          if (rect.top - padY - tipHeight >= wndRect.top) {
            x = vertX;
            y = rect.top - padY - tipHeight;
            tipSide = "top";
            break;
          }
        } else if (order[i] === "bottom") {
          if (rect.bottom + padY + tipHeight <= wndRect.bottom) {
            x = vertX;
            y = rect.bottom + padY;
            tipSide = "bottom";
            break;
          }
        }
      }
      if (x === undefined) {
        if (wndRect.right - rect.right > rect.left - wndRect.left) {
          x = rect.right + padX;
          y = horzY;
          tipSide = "right";
        } else {
          x = rect.left - padX - tipWidth;
          y = horzY;
          tipSide = "left";
        }
      }
      tipRect = {
        left: x,
        top: y,
        right: x + tipWidth,
        bottom: y + tipHeight
      };
      reveal(x, y);
      if (tipHeight > wndRect.bottom - wndRect.top) {
        node.mousewheel(tipScroll);
      }
    }
    function side_show() {
      if(side_tooltipWrapper == null) {
        side_initialize();
      }

      side_tooltipWrapper.css({left: 0, top: 0, visibility: "hidden"}).show();

      var wnd = $(window);
      var wndRect = {
        left: 50, top: 5,
        right: wnd.width() - 50, bottom: wnd.height() - 5,
      };

      var tipWidth = side_tooltipWrapper.outerWidth();
      var tipHeight = side_tooltipWrapper.outerHeight();

      var horzY = Math.max(Math.min(tipRect.top, wndRect.bottom - tipHeight), wndRect.top);
      var vertX = (wndRect.right - tipRect.right > tipRect.left - wndRect.left ? tipRect.right + 2 : tipRect.left - tipWidth - 2);

      var x, y;
      if (tipSide === "right") {
        x = tipRect.right + 2;
        y = horzY;
      } else if (tipSide === "left") {
        x = tipRect.left - tipWidth - 2;
        y = horzY;
      } else if (tipSide === "top") {
        x = vertX;
        y = Math.max(tipRect.bottom - tipHeight, wndRect.top);
      } else {
        x = vertX;
        y = vertY;
      }

      if (enabled) {
        side_tooltipWrapper.css({left: x, top: y, visibility: "visible"});
      }
    }

    var cache = {};
    var loadingTimeout;

    function side_hide() {
      if (side_tooltipWrapper) {
        side_tooltipWrapper.hide();
      }
    }
    function hide() {
      side_hide();
      if (curNode) {
        $(curNode).unmousewheel(tipScroll);
      }
      curNode = undefined;
      curCompare = undefined;
      tipRect = undefined;
      clearTimeout(loadingTimeout);
      if (tooltipWrapper) {
        tooltipWrapper.hide();
      }
    }

    function reveal(x, y) {
      if (enabled) {
        var wnd = $(window);
        tooltipWrapper.css({left: x, top: y, visibility: "visible"});
      }
    }

    function showHtml(node, html, x, y) {
      if(tooltipWrapper == null) {
        initialize();
      }
      tooltipWrapper.css("max-width", "none");
      tooltipContent.removeClass().addClass("tooltip-content");
      tooltipContent.html(html);
      show(node, x, y);
    }
    function showSkill(node, cls, skill, rune, onlyrune) {
      if(tooltipWrapper == null) {
        initialize();
      }
      tooltipWrapper.css("max-width", "");
      tooltipContent.removeClass().addClass("d3-tooltip-wrapper-inner");

      var info = DiabloCalc.skilltips[cls][skill];
      var html;
      if (info) {
        if (!rune || rune == "x") onlyrune = false;
        var element = (info.elements ? info.elements[rune ? rune : "x"] : "phy");
        var html = "<div class=\"d3-tooltip d3-tooltip-" + (onlyrune ? "rune" : "skill") + "\">";
        html += "<div class=\"tooltip-skill-effect effect-" + element + "\"><div class=\"tooltip-head\"><h3>";
        if (onlyrune) {
          html += DiabloCalc.skills[cls][skill].runes[rune] + "</h3></div></div>";
          html += "<div class=\"tooltip-body\"><span class=\"d3-icon d3-icon-rune d3-icon-rune-medium\"><span class=\"rune-" + rune + "\"></span></span>";
          html += "<div class=\"description\">";
          var desc = info[rune];
          var pos = desc.indexOf("<p class=\"subtle\">");
          if (pos >= 0) {
            desc = desc.slice(0, pos) + "<p class=\"special\">" + DiabloCalc.skills[cls][skill].name + "</p>" + desc.slice(pos);
          }
          html += desc;
          html += "</div><span class=\"clear\"><!--   --></span></div>";
        } else {
          html += DiabloCalc.skills[cls][skill].name + "</h3></div></div>";
          html += info.x;
          if (rune && rune != "x") {
            html += "<div class=\"tooltip-extension rune-extension\"><span class=\"d3-icon d3-icon-rune d3-icon-rune-large\"><span class=\"rune-" + rune + "\"></span></span>";
            html += "<h3 class=\"header-3\">" + DiabloCalc.skills[cls][skill].runes[rune] + "</h3>";
            html += info[rune];
            html += "</div>";
          }
        }
        html += "</div>";
      } else if (DiabloCalc.passives[cls][skill]) {
        html = "<div class=\"d3-tooltip d3-tooltip-trait\"><div class=\"tooltip-head\"><h3>" + DiabloCalc.passives[cls][skill].name + "</h3></div>";
        html += DiabloCalc.passivetips[cls][skill];
        html += "</div>";
      }

      tooltipContent.html(html);
      show(node);
    }
    function showCustomSkill(node, info) {
      if(tooltipWrapper == null) {
        initialize();
      }
      tooltipWrapper.css("max-width", "");
      tooltipContent.removeClass().addClass("d3-tooltip-wrapper-inner");

      var html = "<div class=\"d3-tooltip d3-tooltip-skill\">";
      html += "<div class=\"tooltip-head\"><h3>" + info.name + "</h3></div>";
      html += "<div class=\"tooltip-body\">";
      html += "<span class=\"d3-icon d3-icon-skill d3-icon-skill-64 miscbuffs-icon\" style=\"background-position: -" +
        (info.icon * 64) + "px 0; width: 64px; height: 64px\"><span class=\"frame\"></span></span>";
      html += "<div class=\"description\">";
      for (var i = 0; i < info.desc.length; ++i) {
        html += "<p>" + info.desc[i].replace(/\+?[0-9]+(?:\.[0-9]+)?%?/g, "<span class=\"d3-color-green\">$&</span>") + "</p>";
      }
      if (info.level) {
        html += "<p class=\"subtle\">" + _L("Unlocked at level <em>{0}</em>").format(info.level) + "</p>";
      }
      html += "</div></div></div>";
      tooltipContent.html(html);
      show(node);
    }
    function showAttack(node, info) {
      if(tooltipWrapper == null) {
        initialize();
      }
      tooltipWrapper.css("max-width", "");
      tooltipContent.removeClass().addClass("d3-tooltip-wrapper-inner");

      var html = "<div class=\"d3-tooltip d3-tooltip-skill\">";
      html += "<div class=\"tooltip-skill-effect effect-phy\"><div class=\"tooltip-head\"><h3>" + info.name + "</h3></div></div>";
      html += "<div class=\"tooltip-body\"><span class=\"d3-icon d3-icon-skill d3-icon-skill-64 skill-icon-attack " + info.id + "\">";
      html += "<span class=\"frame\"></span></span> <div class=\"description\"><p>" + info.tip + "</p></div></div></div>";
      tooltipContent.html(html);
      show(node);
    }
    var slotSize = {
      head: "default",
      shoulders: "default",
      neck: "square",
      torso: "big",
      waist: "square",
      hands: "default",
      wrists: "default",
      legs: "default",
      feet: "default",
      finger: "square",
      onehand: "default",
      twohand: "default",
      offhand: "default",
      follower: "square",
      custom: "square",
    };
    function formatBonus(format, values, spans, stat) {
      if (!(values instanceof Array)) {
        tmp = values;
        values = [];
        if (tmp.min && tmp.max) {
          values.push({min: tmp.min, max: tmp.max});
        }
        if (tmp.min2 && tmp.max2) {
          values.push({min: tmp.min2, max: tmp.max2});
        }
      }
      if (values.length <= 1) {
        format = format.replace(/%d-%d/g, "%d");
      }
      var hasSpan = (format.indexOf("%d-%d") >= 0);
      if (spans) {
        format = format.replace(/%d-%d/g, "%d&#x2013;%d");
        format = format.replace(/\+?(?:%d|%\.[0-9]f)(?:%%)?/g,
          spans > 1 ? "<span class=\"d3-color-blue\"><span class=\"value\">$&</span></span>" : "<span class=\"value\">$&</span>");
        format = format.replace(/[0-9]+(?:\.[0-9]+)?(?:-[0-9]+)?%%/g, "<span class=\"value\">$&</span>");
        format = format.replace(/\r\n/g, "<br/><span class=\"tooltip-icon-bullet\"/>");
      }
      var index = 0;
      function fmtValue(val, p) {
        if (typeof val === "number") {
          return DiabloCalc.formatNumber(val, p, 10000);
        } else if (val && val.min && val.max) {
          var res = DiabloCalc.formatNumber(val.min || 0, p, 10000) + "&#x2013;" + DiabloCalc.formatNumber(val.max || 0, p, 10000);
          if (hasSpan) {
            res = "(" + res + ")";
          }
          return res;
        } else {
          return "0";
        }
      }
      format = format.replace(/%(d|p|\.[0-9]f|%)/g, function(m, arg) {
        if (arg == "%") {
          return "%";
        } else if (arg == "d") {
          return (index >= values.length ? "0" : fmtValue(values[index++], 0));
        } else if (arg == "p") {
          if (index >= values.length) return "unknown";
          var passive = DiabloCalc.allPassives[values[index++]];
          return (passive ? passive.name : "unknown");
        } else {
          return (index >= values.length ? "0" : fmtValue(values[index++], arg[1]));
        }
      }).replace(/([0-9])-([0-9])/g, "$1&#x2013;$2");
      if (stat && DiabloCalc.stats[stat] && DiabloCalc.stats[stat].class) {
        var charClass = $(".char-class").val();
        if (charClass == DiabloCalc.stats[stat].class) {
          format += " (" + _L("{0} Only").format(DiabloCalc.classes[DiabloCalc.stats[stat].class].name) + ")";
        } else {
          format += " <span class=\"d3-color-red\">(" + _L("{0} Only").format(DiabloCalc.classes[DiabloCalc.stats[stat].class].name) + ")</span>";
        }
      }
      return format;
    }
    function haveRorg() {
      return DiabloCalc.getSlotId("leftfinger") === "Unique_Ring_107_x1" ||
             DiabloCalc.getSlotId("rightfinger") === "Unique_Ring_107_x1";
    }
    function showItem(node, slot, _side) {
      var data;
      var compare = false;
      if (typeof slot === "string") {
        if (DiabloCalc.itemSlots[slot]) {
          data = DiabloCalc.getSlot(slot);
          var types = (DiabloCalc.getOffhandTypes && slot === "offhand" ? DiabloCalc.getOffhandTypes() : DiabloCalc.itemSlots[slot].types);
          for (var type in types) {
            if (types[type].classes && types[type].classes.indexOf(DiabloCalc.charClass) < 0) continue;
            slotSize.custom = slotSize[DiabloCalc.itemTypes[type].slot];
            break;
          }
        } else if (DiabloCalc.itemById[slot]) {
          data = {id: slot, template: true};
          slot = undefined;
          if (typeof _side === "string") {
            slot = _side;
            var types = (DiabloCalc.getOffhandTypes && slot === "offhand" ? DiabloCalc.getOffhandTypes() : DiabloCalc.itemSlots[slot].types);
            for (var type in types) {
              if (types[type].classes && types[type].classes.indexOf(DiabloCalc.charClass) < 0) continue;
              slotSize.custom = slotSize[DiabloCalc.itemTypes[type].slot];
              break;
            }
          } else {
            data.custom = _side;
            slotSize.custom = "square";
          }
          _side = undefined;
        }
      } else {
        compare = !_side;
        data = slot;
        slot = undefined;
        slotSize.custom = "square";
      }
      if (!data || !DiabloCalc.itemById[data.id]) {
        return;
      }

      if (_side && !side_tooltipWrapper) {
        side_initialize();
      }
      if(!_side && !tooltipWrapper) {
        initialize();
      }

      var _content = (_side ? side_tooltipContent : tooltipContent);
      var _wrapper = (_side ? side_tooltipWrapper : tooltipWrapper);

      _content.empty();
      _wrapper.css("max-width", "");
      _content.removeClass().addClass("d3-tooltip-wrapper-inner");

      var charClass = $(".char-class").val();

      var item = DiabloCalc.itemById[data.id];
      var color = DiabloCalc.qualities[item.quality].color;
      var affixes = DiabloCalc.getItemAffixesById(data.id, data.ancient, true);

      if (data.template) {
        data.stats = {};
        data.varies = [];
        var required = DiabloCalc.getItemAffixesById(data.id, data.ancient, "only");
        var remain = DiabloCalc.getStatCount(data.id);
        remain = remain[0] + remain[1];
        for (var stat in required) {
          data.stats[stat] = required[stat];
          if (!DiabloCalc.stats[stat].base) {
            --remain;
          }
        }
        var preset = DiabloCalc.getItemPreset(data.id);
        for (var i = 0; i < preset.length; ++i) {
          var list = DiabloCalc.smartListStats(preset[i], affixes);
          if (list.length === 1) {
            data.stats[list[0]] = affixes[list[0]];
            --remain;
          } else if (list.length > 1) {
            data.varies.push(list);
            --remain;
          }
        }
        if (data.stats.custom && data.custom) {
          data.stats.custom = data.custom;
        }
        data.random = remain;
      }
      
      var icon = data.id;
      if (icon == "custom" && slot) {
        var types = (DiabloCalc.getOffhandTypes && slot === "offhand" ? DiabloCalc.getOffhandTypes() : DiabloCalc.itemSlots[slot].types);
        for (var type in types) {
          if (types[type].classes && types[type].classes.indexOf(DiabloCalc.charClass) < 0) continue;
          icon = DiabloCalc.itemTypes[type].generic;
          break;
        }
      }
      icon = DiabloCalc.getItemIcon(icon);
      var itemType = DiabloCalc.itemTypes[item.type];
      var bgEffect = null;
      for (var stat in data.stats) {
        if (DiabloCalc.stats[stat].elemental) {
          bgEffect = DiabloCalc.stats[stat].elemental;
          break;
        }
      }
      var effectString = "";
      if (bgEffect && slotSize[itemType.slot] != "square") {
        effectString = " effect-bg effect-bg-" + bgEffect;
      } else if (data.stats.basearmor) {
        effectString = " effect-bg effect-bg-armor";
        if (slotSize[itemType.slot] != "default") {
          effectString += " effect-bg-armor-" + slotSize[itemType.slot];
        }
      }

      var outer = $("<div class=\"d3-tooltip d3-tooltip-item\"></div>");
      _content.append(outer);

      outer.append("<div class=\"tooltip-head tooltip-head-" + color + "\"><h3 class=\"d3-color-" + color + "\">" + item.name + "</h3></div>");

      var ttbody = $("<div class=\"tooltip-body" + effectString + "\"></div>");
      outer.append(ttbody);

      ttbody.append("<span class=\"d3-icon d3-icon-item d3-icon-item-large d3-icon-item-" + color + "\">" +
                     "<span class=\"icon-item-gradient\">" +
                      "<span class=\"icon-item-inner icon-item-" + slotSize[itemType.slot] + (data.ancient ? " ancient" : "") + "\" style=\"background-image: url(" + icon + ");\"></span>" +
                     "</span>" +
                    "</span>");

      var props = $("<div class=\"d3-item-properties\"></div>");
      ttbody.append(props);

      var slotInfo = (DiabloCalc.metaSlots[itemType.slot] || DiabloCalc.itemSlots[itemType.slot]);
      var classSpecific = "";
      if (item.class || itemType.class) {
        classSpecific = "<li class=\"item-class-specific d3-color-white\">" + DiabloCalc.classes[item.class || itemType.class].name + "</li>";
      }
      props.append("<ul class=\"item-type-right\"><li class=\"item-slot\">" + slotInfo.name + "</li>" + classSpecific + "</ul>");
      var ancient = "";
      if (data.ancient) {
        ancient = _L("Ancient ");
        //FTFY
        //ancient = "Ethereal ";
      }
      props.append("<ul class=\"item-type\"><li class=\"d3-color-" + color + "\">" + ancient + DiabloCalc.qualities[item.quality].prefix + itemType.name + "</li></ul>");

      if (data.stats.basearmor) {
        var armor, armor_max;
        if (data.stats.basearmor instanceof Array) {
          armor = data.stats.basearmor[0];
        } else {
          armor = (data.stats.basearmor.min || 0);
          armor_max = (data.stats.basearmor.max || 0);
        }
        if (data.stats.armor) {
          if (data.stats.armor instanceof Array) {
            armor += data.stats.armor[0];
          } else {
            armor_max = (armor_max || armor) + (data.stats.armor.max || 0);
            armor += (data.stats.armor.min || 0);
          }
        }
        if (armor_max) {
          armor += "&#x2013;" + armor_max;
        }
        props.append("<ul class=\"item-armor-weapon item-armor-armor\"><li class=\"big\"><p><span class=\"value\">" + armor + "</span></p></li><li>" + _L("Armor") + "</li></ul>");
      }
      if (itemType.weapon) {
        //TODO: fix quality
        var speed = itemType.weapon.speed;
        var dmgmin = itemType.weapon.min;
        var dmgmax = itemType.weapon.max;
        var dmgmin_max, dmgmax_max, speed_max;
        if (data.gems) {
          for (var i = 0; i < data.gems.length; ++i) {
            if (data.gems[i][1] === "ruby") {
              dmgmin += DiabloCalc.gemColors.ruby.weapon.amount[data.gems[i][0]];
              dmgmax += DiabloCalc.gemColors.ruby.weapon.amount[data.gems[i][0]];
            }
          }
        }
        for (var stat in data.stats) {
          if (DiabloCalc.stats[stat].damage) {
            if (data.stats[stat] instanceof Array) {
              dmgmin += data.stats[stat][0];
              dmgmax += data.stats[stat][1];
            } else {
              dmgmin_max = (dmgmin_max || dmgmin) + (data.stats[stat].max || 0);
              dmgmin += (data.stats[stat].min || 0);
              dmgmax_max = (dmgmax_max || dmgmax) + (data.stats[stat].max2 || 0);
              dmgmax += (data.stats[stat].min2 || 0);
            }
          }
        }
        if (data.stats.damage) {
          if (data.stats.damage instanceof Array) {
            dmgmin *= (1 + 0.01 * data.stats.damage[0]);
            dmgmax *= (1 + 0.01 * data.stats.damage[0]);
          } else {
            dmgmin_max = (dmgmin_max || dmgmin) * (1 + 0.01 * (data.stats.damage.max || 0));
            dmgmin *= (1 + 0.01 * (data.stats.damage.min || 0));
            dmgmax_max = (dmgmax_max || dmgmax) * (1 + 0.01 * (data.stats.damage.max2 || 0));
            dmgmax *= (1 + 0.01 * (data.stats.damage.min2 || 0));
          }
        }
        if (data.stats.weaponias) {
          if (data.stats.weaponias instanceof Array) {
            speed *= (1 + 0.01 * data.stats.weaponias[0]);
          } else {
            speed_max = (speed_max || speed) * (1 + 0.01 * (data.stats.weaponias.max || 0));
            speed *= (1 + 0.01 * (data.stats.weaponias.min || 0));
          }
        }
        var dps = ((dmgmin + dmgmax) * speed / 2).toFixed(1);
        var cls = "big";
        if (dmgmin_max || dmgmax_max || speed_max) {
          dps += "&#x2013;" + (((dmgmin_max || dmgmin) + (dmgmax_max || dmgmax)) * (speed_max || speed) / 2).toFixed(1);
          cls = "med";
        }
        dmgmin = Math.round(dmgmin);
        dmgmax = Math.round(dmgmax);
        speed = speed.toFixed(2);
        if (dmgmin_max) {
          dmgmin = "(" + dmgmin + "&#x2013;" + Math.round(dmgmin_max) + ")";
        }
        if (dmgmax_max) {
          dmgmax = "(" + dmgmax + "&#x2013;" + Math.round(dmgmax_max) + ")";
        }
        if (speed_max) {
          speed += "&#x2013;" + speed_max.toFixed(2);
        }
        props.append("<ul class=\"item-armor-weapon item-weapon-dps\"><li class=\"" + cls + "\"><span class=\"value\">" + dps + "</span></li><li>" + _L("Damage Per Second") + "</li></ul>");
        props.append("<ul class=\"item-armor-weapon item-weapon-damage\">" +
          "<li><p><span class=\"value\">" + dmgmin + "</span>&#x2013;<span class=\"value\">" + dmgmax + "</span> <span class=\"d3-color-FF888888\">" + _L("Damage") + "</span></p></li>" +
          "<li><p><span class=\"value\">" + speed + "</span> <span class=\"d3-color-FF888888\">" + _L("Attacks per Second") + "</span></p></li></ul>");
      }
      if (data.stats.baseblock && data.stats.blockamount) {
        var block, block_max;
        if (data.stats.baseblock instanceof Array) {
          block = data.stats.baseblock[0];
        } else {
          block = (data.stats.baseblock.min || 0);
          block_max = (data.stats.baseblock.max || 0);
        }
        if (data.stats.block) {
          if (data.stats.block instanceof Array) {
            block += data.stats.block[0];
          } else {
            block_max = (block_max || block) + (data.stats.block.max || 0);
            block += (data.stats.block.min || 0);
          }
        }
        block = block.toFixed(1);
        if (block_max) {
          block += "&#x2013;" + block_max.toFixed(1);
        }
        var blockamount;
        if (data.stats.blockamount instanceof Array) {
          blockamount = data.stats.blockamount[0].toFixed(0) + "</span>&#x2013;<span class=\"value\">" + data.stats.blockamount[1].toFixed(0);
        } else {
          blockamount = "(" + (data.stats.blockamount.min || 0).toFixed(0) + "&#x2013;" + (data.stats.blockamount.max || 0).toFixed(0) + ")";
          blockamount += "</span>&#x2013;<span class=\"value\">";
          blockamount += "(" + (data.stats.blockamount.min2 || 0).toFixed(0) + "&#x2013;" + (data.stats.blockamount.max2 || 0).toFixed(0) + ")";
        }
        props.append("<ul class=\"item-armor-weapon item-armor-shield\"><li><p><span class=\"value\">+" + block +
          "%</span> <span class=\"d3-color-FF888888\">Chance to Block</span></p></li><li><p><span class=\"value\">" + blockamount +
          "</span> <span class=\"d3-color-FF888888\">Block Amount</span></p></li></ul>");
      }

      props.append("<div class=\"item-before-effects\"></div>");

      var effects = $("<ul class=\"item-effects\"></ul>");
      props.append(effects);

      for (var catType = 0; catType < 2; ++catType) {
        var category = null;
        for (var stat in data.stats) {
          if (stat == "sockets" || DiabloCalc.stats[stat].base) {
            continue;
          }
          if ((catType == 0 && DiabloCalc.stats[stat].secondary) || (catType == 1 && !DiabloCalc.stats[stat].secondary)) {
            continue;
          }
          if (!category) {
            category = $("<p class=\"item-property-category\">" + (catType == 0 ? "Primary" : "Secondary") + "</p>");
            effects.append(category);
          }

          var propType = "default";
          if (DiabloCalc.stats[stat].utility) {
            propType = "utility";
          }
          if (data.enchant === stat) {
            propType = "enchant";
          }
          var propColor = (stat == "custom" ? "orange" : "blue");

          var format = DiabloCalc.stats[stat].format;
          if (stat == "custom" && item.required && item.required.custom) {
            format = item.required.custom.format;
          }
          var range = "";
          if (!data.template && affixes[stat] && affixes[stat].min && affixes[stat].max) {
            var minval = affixes[stat].min, maxval = affixes[stat].max;
            if (affixes[stat].max2 && DiabloCalc.stats[stat].damage) {
              maxval = affixes[stat].max2;
            }
            var mintmp = minval, maxtmp = maxval;
            var decimal = 0;
            while (decimal < 2 && (Math.floor(mintmp - 1e-6) == Math.floor(mintmp + 1e-6) || Math.floor(maxtmp - 1e-6) == Math.floor(maxtmp + 1e-6))) {
              mintmp = mintmp * 10;
              maxtmp = maxtmp * 10;
              decimal += 1;
            }
            range = "<span class=\"d3-color-gray d3-tooltip-range\"> [" + DiabloCalc.formatNumber(minval, decimal, 10000) + " - " +
              DiabloCalc.formatNumber(maxval, decimal, 10000) + "]" + (format.match(/%(d|\.[0-9]f)%%/g) ? "%" : "") + "</span>";
          }
          format = formatBonus(format, data.stats[stat], stat == "custom" ? 2 : 1, stat);
          effects.append("<li class=\"d3-color-" + propColor + " d3-item-property-" + propType + "\"><p>" + format + range + "</p></li>");
        }
      }

      if (data.varies || data.random) {
        effects.append("<br/>");
        if (data.varies) {
          for (var i = 0; i < data.varies.length; ++i) {
            var list = data.varies[i];
            var choice_outer = $("<li class=\"item-effects-choice\"></li>");
            choice_outer.append("<span class=\"d3-color-blue\">One of <span class=\"value\">" + list.length + "</span> Magic Properties (varies)</span>");
            var choice = $("<ul></ul>");
            for (var j = 0; j < list.length; ++j) {
              var format = formatBonus(DiabloCalc.stats[list[j]].format, affixes[list[j]], 1, list[j]);
              choice.append("<li><span class=\"d3-color-blue\"><p>" + format + "</p></span></li>");
            }
            choice_outer.append(choice);
            effects.append(choice_outer);
          }
        }
        if (data.random) {
          effects.append("<li class=\"d3-color-blue\"><span class=\"value\">+" + data.random + "</span> Random Magic Properties</li>");
        }
      }

      //FTFY
      //if (data.ancient) {
      //  effects.append("<li class=\"d3-color-blue d3-item-property-default\"><p>Ethereal (Cannot be Repaired)</p></li>");
      //}

      if (data.stats.sockets) {
        var slotType = slotInfo.socketType;
        if (slotType != "weapon" && slotType != "head") {
          slotType = "other";
        }
        var numSockets = (data.stats.sockets.max || data.stats.sockets[0]);
        for (var gi = 0; gi < numSockets; ++gi) {
          if (data.gems && gi < data.gems.length) {
            var gem = data.gems[gi];
            if (DiabloCalc.legendaryGems[gem[0]] && DiabloCalc.legendaryGems[gem[0]].effects) {
              var info = DiabloCalc.legendaryGems[gem[0]];
              var icon = DiabloCalc.getItemIcon(gem[0], "small");
              var value = info.effects[0].value.slice();
              for (var i = 0; i < value.length; ++i) {
                value[i] += gem[1] * info.effects[0].delta[i];
              }
              var effect1 = formatBonus(info.effects[0].format || DiabloCalc.stats[info.effects[0].stat].format, value, 2, info.effects[0].stat);
              var effect2 = formatBonus(info.effects[1].format || DiabloCalc.stats[info.effects[1].stat].format, info.effects[1].value || [], gem[1] < 25 ? 1 : 2, info.effects[1].stat);
              if (gem[1] < 25) {
                effect2 += " <span class=\"d3-color-red\">(Requires Rank 25)</span>";
              }
              var sock = $("<li class=\"full-socket\"></li>");
              sock.append("<img class=\"gem\" src=\"" + icon + "\" />");
              sock.append("<span class=\"d3-color-orange\">" + info.name + "</span>");
              if (gem[1]) {
                sock.append(" <span class=\"item-jewel-rank\">&#x2013; Rank " + gem[1] + "</span>");
              }
              var ul = $("<ul></ul>");
              ul.append("<li class=\"jewel-effect d3-color-" + /*(info.effects[0].stat ? "blue" : "orange")*/"orange" + "\"><p>" + effect1 + "</p></li>");
              ul.append("<li class=\"jewel-effect d3-color-" + (gem[1] < 25 ? "gray" : /*(info.effects[1].stat ? "blue" : "orange")*/"orange") + "\"><p>" + effect2 + "</p></li>");
              effects.append(sock.append(ul));
            } else if (DiabloCalc.gemColors[gem[1]]) {
              var info = DiabloCalc.gemColors[gem[1]];
              var icon = DiabloCalc.getItemIcon(gem, "small");
              var effect = formatBonus(DiabloCalc.stats[info[slotType].stat].format, [info[slotType].amount[gem[0]]], info[slotType].stat);
              effects.append("<li class=\"d3-color-white full-socket\"><img class=\"gem\" src=\"" + icon + "\" /><span class=\"socket-effect\">" + effect + "</span></li>");
            }
          } else {
            effects.append("<li class=\"empty-socket d3-color-blue\">Empty Socket</li>");
          }
        }
      }

      if (item.set) {
        var ul = $("<ul class=\"item-itemset\"></ul>");
        props.append(ul);

        var set = DiabloCalc.itemSets[item.set];
        var indexes = {};
        var colors = [];
        var count = 0;
        for (var i = 0; i < set.items.length; ++i) {
          indexes[set.items[i].id] = i;
          colors.push("gray");
        }
        for (var s in DiabloCalc.itemSlots) {
          var sid = DiabloCalc.getSlotId(s);
          if (sid && indexes[sid] !== undefined) {
            colors[indexes[sid]] = "white";
            count++;
          }
        }
        if (count > 1 && haveRorg()) {
          count++;
        }

        ul.append("<li class=\"item-itemset-name\"><span class=\"d3-color-green\">" + set.name + "</span></li>");
        for (var i = 0; i < set.items.length; ++i) {
          var type = DiabloCalc.itemTypes[set.items[i].type];
          var slot = (DiabloCalc.itemSlots[type.slot] || DiabloCalc.metaSlots[type.slot]);
          ul.append("<li class=\"item-itemset-piece indent\"><span class=\"d3-color-" + colors[i] + "\">" + set.items[i].name + " (" + slot.name + ")</span></li>");
        }
        for (var amount in set.bonuses) {
          var bonusColor = (parseInt(amount) <= count ? "green" : "gray");
          ul.append("<li class=\"d3-color-" + bonusColor + " item-itemset-bonus-amount\">(<span class=\"value\">" + amount + "</span>) Set:</li>");
          for (var i = 0; i < set.bonuses[amount].length; ++i) {
            var bonus = set.bonuses[amount][i];
            var effect = formatBonus(bonus.stat ? DiabloCalc.stats[bonus.stat].format : bonus.format, bonus.value || [], 1, bonus.stat);
            ul.append("<li class=\"d3-color-" + bonusColor + " item-itemset-bonus-desc indent\">" + effect + "</li>");
          }
        }
      }

      props.append("<ul class=\"item-extras\"><li class=\"item-reqlevel\"><span class=\"d3-color-gold\">Required Level:</span> <span class=\"value\">70</span></li>" +
        "<li>Account Bound</li></ul><span class=\"item-unique-equipped\">Unique Equipped</span><span class=\"clear\"><!--   --></span>");

      var sideSlot;
      if (compare && DiabloCalc.tipStatList) {
        curCompare = data;
        var slots = [];
        for (var slot in DiabloCalc.itemSlots) {
          if (DiabloCalc.itemSlots[slot].item && DiabloCalc.itemSlots[slot].item.id === data.id) {
            slots = [slot];
            break;
          }
          if (DiabloCalc.itemSlots[slot].item && DiabloCalc.isItemAllowed(slot, data.id)) {
            slots.push(slot);
          }
        }
        if (slots.length) {
          slot = slots[0];
          if (slots.length > 1 && altKey) {
            slot = slots[1];
          }
          sideSlot = slot;
          var stats = DiabloCalc.getStats();
          if (shiftKey && DiabloCalc.itemSlots[slot].item && DiabloCalc.itemSlots[slot].item.gems) {
            //sideSlot = $.extend({}, DiabloCalc.itemSlots[slot].item);
            //sideSlot.gems = [];
            stats = DiabloCalc.computeStats(function(id) {
              if (id === slot) {
                var tmp = $.extend({}, DiabloCalc.itemSlots[slot].item);
                tmp.gems = [];
                return tmp;
              } else {
                return DiabloCalc.getSlot(id);
              }
            });
          }
          var altStats = DiabloCalc.computeStats(function(id) {
            if (id === slot) {
              if (shiftKey) {
                var tmp = $.extend({}, data);
                tmp.gems = [];
                return tmp;
              } else {
                return data;
              }
            }
            else return DiabloCalc.getSlot(id);
          });
          var out = [];
          for (var x in DiabloCalc.tipStatList) {
            var value = stats.getValue(DiabloCalc.tipStatList[x].stat);
            var altValue = altStats.getValue(DiabloCalc.tipStatList[x].stat);
            if (1 || value !== altValue) {
              var delta = altValue - value;
              var percent = (value < 0.01 ? 100000 : 100 * delta / value);
              out.push([percent, "<li><span class=\"tooltip-icon-bullet\"></span> <span class=\"d3-color-white\">" + (DiabloCalc.tipStatList[x].shortName || DiabloCalc.tipStatList[x].name) + "</span>: " +
                "<span class=\"d3-color-" + (delta === 0 ? "gray" : (delta > 0 ? "green" : "red")) + "\">" + (value > 0.01 ? DiabloCalc.formatNumber(percent, 2) + "%" : "+&#8734;") +
                "</span></li>"]);
            }
          }
          out.sort(function(a, b) {return b[0] - a[0] + a[1].localeCompare(b[1]) * 0.001;});
          var outStr = "<div class=\"tooltip-extension\"><ul class=\"item-type\"><li><span class=\"d3-color-gold\">Equipping this item will grant you:</span></li>";
          for (var i = 0; i < out.length; ++i) {
            outStr += out[i][1];
          }
          outer.append(outStr + "</ul></div>");
        } else {
          compare = undefined;
        }
      }

      if (_side) {
        side_show();
      } else {
        show(node, undefined, undefined, compare);
        if (compare) {
          showItem(node, sideSlot, true);
        }
      }
    }

    function showGem(node, id, level) {
      var gem = (id instanceof Array ? undefined : DiabloCalc.legendaryGems[id]);
      var reg = (id instanceof Array ? DiabloCalc.gemColors[id[1]] : undefined);
      if (!gem && !reg) {
        return;
      }
      level = (level || 0);
      if(tooltipWrapper == null) {
        initialize();
      }

      tooltipContent.empty();
      tooltipWrapper.css("max-width", "");
      tooltipContent.removeClass().addClass("d3-tooltip-wrapper-inner");

      var charClass = $(".char-class").val();
      var icon = DiabloCalc.getItemIcon(id);

      var outer = $("<div class=\"d3-tooltip d3-tooltip-item\"></div>");
      tooltipContent.append(outer);

      var quality = (gem ? "orange" : "blue");
      outer.append("<div class=\"tooltip-head tooltip-head-" + quality + "\"><h3 class=\"d3-color-" + quality + "\">" +
        (gem ? gem.name : DiabloCalc.gemQualities[id[0]] + " " + reg.name) + "</h3></div>");

      var ttbody = $("<div class=\"tooltip-body\"></div>");
      outer.append(ttbody);

      ttbody.append("<span class=\"d3-icon d3-icon-item d3-icon-item-large d3-icon-item-" + quality + "\">" +
                     "<span class=\"icon-item-gradient\">" +
                      "<span class=\"icon-item-inner icon-item-square\" style=\"background-image: url(" + icon + ");\"></span>" +
                     "</span>" +
                    "</span>");

      var props = $("<div class=\"d3-item-properties\"></div>");
      ttbody.append(props);

      if (gem) {
        if (level) {
          props.append("<ul class=\"item-type-right\"><li class=\"item-jewel-rank\">Rank " + level + "</li></ul>");
        }
        props.append("<ul class=\"item-type\"><li><span class=\"d3-color-orange\">Legendary Gem</span></li></ul>");
        props.append("<div class=\"item-description d3-color-white\"><p></p></div>");
      } else {
        props.append("<ul class=\"item-type\"><li><span class=\"d3-color-default\">Gem</span></li></ul>");
      }

      props.append("<div class=\"item-before-effects\"></div>");
      var effects = $("<ul class=\"item-effects\"></ul>");
      props.append(effects);

      if (gem) {
        var value = gem.effects[0].value.slice();
        for (var i = 0; i < value.length; ++i) {
          value[i] += level * gem.effects[0].delta[i];
        }
        var effect1 = formatBonus(gem.effects[0].format || DiabloCalc.stats[gem.effects[0].stat].format, value, 2, gem.effects[0].stat);
        var effect2 = formatBonus(gem.effects[1].format || DiabloCalc.stats[gem.effects[1].stat].format, gem.effects[1].value || [], level < 25 ? 1 : 2, gem.effects[1].stat);
        if (level < 25) {
          effect2 += " <span class=\"d3-color-red\">(Requires Rank 25)</span>";
        }

        effects.append("<li class=\"d3-color-orange d3-item-property-default\"><p>" + effect1 + "</p></li>");
        effects.append("<li class=\"d3-color-" + (level < 25 ? "gray" : "orange") + " d3-item-property-default\"><p>" + effect2 + "</p></li>");

        props.append("<ul class=\"item-extras\"><li>Account Bound</li></ul><span class=\"item-unique-equipped\">Unique Equipped</span><span class=\"clear\"><!--   --></span>");
      } else {
        effects.append("<li class=\"d3-color-white\">Can be inserted into equipment with sockets.</li>");
        effects.append("<li class=\"gem-effect\"><span class=\"d3-color-gray\">Helm:</span> " + formatBonus(
          DiabloCalc.stats[reg.head.stat].format, [reg.head.amount[id[0]]]) + "</li>");
        effects.append("<li class=\"gem-effect\"><span class=\"d3-color-gray\">Weapon:</span> " + formatBonus(
          DiabloCalc.stats[reg.weapon.stat].format, [reg.weapon.amount[id[0]]]) + "</li>");
        effects.append("<li class=\"gem-effect\"><span class=\"d3-color-gray\">Other:</span> " + formatBonus(
          DiabloCalc.stats[reg.other.stat].format, [reg.other.amount[id[0]]]) + "</li>");
        props.append("<ul class=\"item-extras\"><li>Account Bound</li><li>Maximum Stack Amount: <span class=\"value\">5000</span></li></ul><span class=\"clear\"><!--   --></span>");
      }

      show(node);
    }

    $(document).keydown(function(e) {
      if (e.which == 17 && tooltipWrapper) {
        tooltipWrapper.addClass("d3-tooltip-showrange");
      }
      if (e.which === 16 || e.which === 18) {
        if (e.which === 16) shiftKey = true;
        if (e.which === 18) altKey = true;
        if (curNode && curCompare) {
          showItem(curNode, curCompare);
          return false;
        }
      }
    }).keyup(function(e) {
      if (e.which == 17 && tooltipWrapper) {
        tooltipWrapper.removeClass("d3-tooltip-showrange");
      }
      if (e.which === 16 || e.which === 18) {
        if (e.which === 16) shiftKey = false;
        if (e.which === 18) altKey = false;
        if (curNode && curCompare) {
          showItem(curNode, curCompare);
          return false;
        }
      }
    });

    this.show = show;
    this.hide = hide;
    this.showItem = showItem;
    this.showHtml = showHtml;
    this.showSkill = showSkill;
    this.showCustomSkill = showCustomSkill;
    this.showGem = showGem;
    this.showAttack = showAttack;
    this.getNode = function() {
      return curNode;
    };
    this.enable = function() {
      enabled = true;
    };
    this.disable = function() {
      enabled = false;
      hide();
    };
  };
})();
