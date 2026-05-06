function _M0TP38username13ipod__moonbit4ipod12SongMetadata(param0, param1, param2, param3, param4, param5, param6, param7, param8) {
  this.title = param0;
  this.artist = param1;
  this.album = param2;
  this.artwork = param3;
  this.duration = param4;
  this.currentTime = param5;
  this.rating = param6;
  this.trackNumber = param7;
  this.totalTracks = param8;
}
function _M0TP38username13ipod__moonbit4ipod17PresentationState(param0, param1, param2, param3) {
  this.skinColor = param0;
  this.bgColor = param1;
  this.viewMode = param2;
  this.hardwarePreset = param3;
}
function _M0TP38username13ipod__moonbit4ipod16InteractionState(param0, param1, param2, param3, param4, param5, param6) {
  this.interactionModel = param0;
  this.osScreen = param1;
  this.menuIndex = param2;
  this.osOriginalMenuSplit = param3;
  this.isNowPlayingEditable = param4;
  this.isPlaying = param5;
  this.batteryLevel = param6;
}
function _M0TP38username13ipod__moonbit4ipod13PlaybackState(param0, param1, param2, param3, param4) {
  this.currentTime = param0;
  this.duration = param1;
  this.selectionKind = param2;
  this.rangeStartTime = param3;
  this.rangeEndTime = param4;
}
function _M0TP38username13ipod__moonbit4ipod9IpodModel(param0, param1, param2, param3) {
  this.metadata = param0;
  this.presentation = param1;
  this.interaction = param2;
  this.playback = param3;
}
function _M0TP38username13ipod__moonbit4ipod11AppleFinish(param0, param1) {
  this.label = param0;
  this.hex = param1;
}
function _M0TP38username13ipod__moonbit4ipod8Gradient(param0, param1, param2) {
  this.from = param0;
  this.via = param1;
  this.to = param2;
}
function _M0TP38username13ipod__moonbit4ipod15WheelDerivation(param0, param1, param2, param3, param4) {
  this.gradient = param0;
  this.border = param1;
  this.labelColor = param2;
  this.centerBorder = param3;
  this.centerGradient = param4;
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
const _M0MPB7JSArray4push = (arr, val) => { arr.push(val); };
const _M0FPB15ryu__to__string = (number) => number.toString();
const _M0MPC16double6Double8mod__ffi = (a, b) => (a % b);
function $bound_check(arr, index) {
  if (index < 0 || index >= arr.length) throw new Error("Index out of bounds");
}
class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
function _M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE2Ok.prototype.$tag = 1;
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS415 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata("Strobe", "deadmau5", "For Lack of a Better Name", "", 154, 0, 0, 1, 10);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS416 = new _M0TP38username13ipod__moonbit4ipod17PresentationState("#111111", "#1a1a1a", 0, 1);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS417 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(0, 0, 0, 0.55, false, false, 0.85);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS418 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(0, 154, 0, 0, 15);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS419 = new _M0TP38username13ipod__moonbit4ipod9IpodModel(_M0FP38username13ipod__moonbit4ipod14default__modelN6recordS415, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS416, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS417, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS418);
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS420 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Graphite", "#111111");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS421 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Silver", "#C0C0C0");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS422 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Starlight", "#F0E6D3");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS423 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Midnight", "#2B2D42");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS424 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Blue", "#2C5F7C");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS425 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Pink", "#E8B4B8");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS426 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Purple", "#5B4A7A");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS427 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Red", "#B22222");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS428 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Green", "#4A7C59");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS429 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#1C1C1E", "#202022", "#252527");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS430 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#1C1C1E", "#202022", "#252527");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS431 = new _M0TP38username13ipod__moonbit4ipod15WheelDerivation(_M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS429, "#2C2C2E", "#FFFFFF", "#3A3A3C", _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS430);
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS432 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#4A4A4E", "#424246", "#3A3A3E");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS433 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#4E4E52", "#46464A", "#3E3E42");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS434 = new _M0TP38username13ipod__moonbit4ipod15WheelDerivation(_M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS432, "#555558", "#E0E0E0", "#505054", _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS433);
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS435 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#F5F5F7", "#E8E8EA", "#DCDCDC");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS436 = new _M0TP38username13ipod__moonbit4ipod8Gradient("#FFFFFF", "#F0F0F2", "#E5E5EA");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS437 = new _M0TP38username13ipod__moonbit4ipod15WheelDerivation(_M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS435, "#D1D1D6", "#8E8E93", "#D1D1D6", _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS436);
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPC16uint166UInt1618to__string_2einner(self, radix) {
  return _M0MPC13int3Int18to__string_2einner(self, radix);
}
function _M0MPC15array5Array4pushGsE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0IPC16double6DoublePB3Mod3mod(self, other) {
  return _M0MPC16double6Double8mod__ffi(self, other);
}
function _M0MPC16double6Double10to__string(self) {
  return _M0FPB15ryu__to__string(self);
}
function _M0MPC15array5Array2atGRP38username13ipod__moonbit4ipod11AppleFinishE(self, index) {
  const len = self.length;
  if (index >= 0 && index < len) {
    $bound_check(self, index);
    return self[index];
  } else {
    return $panic();
  }
}
function _M0FP38username13ipod__moonbit4ipod16normalize__model(model) {
  const meta = model.metadata;
  const meta$2 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(meta.title, meta.artist, meta.album, meta.artwork, meta.duration < 1 ? 1 : meta.duration, meta.currentTime < 0 ? 0 : meta.currentTime > meta.duration ? meta.duration : meta.currentTime, meta.rating < 0 ? 0 : meta.rating > 5 ? 5 : meta.rating, meta.trackNumber < 1 ? 1 : meta.trackNumber > meta.totalTracks ? meta.totalTracks : meta.trackNumber, meta.totalTracks < 1 ? 1 : meta.totalTracks);
  const inter = model.interaction;
  const inter$2 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(inter.interactionModel, inter.osScreen, inter.menuIndex < 0 ? 0 : inter.menuIndex, inter.osOriginalMenuSplit < 0.4 ? 0.4 : inter.osOriginalMenuSplit > 0.7 ? 0.7 : inter.osOriginalMenuSplit, inter.isNowPlayingEditable, inter.isPlaying, inter.batteryLevel < 0.05 ? 0.05 : inter.batteryLevel > 1 ? 1 : inter.batteryLevel);
  const pb = model.playback;
  const pb$2 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(pb.currentTime < 0 ? 0 : pb.currentTime > meta$2.duration ? meta$2.duration : pb.currentTime, meta$2.duration, pb.selectionKind, pb.rangeStartTime < 0 ? 0 : pb.rangeStartTime > meta$2.duration ? meta$2.duration : pb.rangeStartTime, pb.rangeEndTime < pb.rangeStartTime ? pb.rangeStartTime : pb.rangeEndTime > meta$2.duration ? meta$2.duration : pb.rangeEndTime);
  return new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$2, model.presentation, inter$2, pb$2);
}
function _M0FP38username13ipod__moonbit4ipod7im__str(im) {
  switch (im) {
    case 0: {
      return "direct";
    }
    case 1: {
      return "ipod-os";
    }
    default: {
      return "ipod-os-original";
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod7os__str(os) {
  if (os === 0) {
    return "menu";
  } else {
    return "now-playing";
  }
}
function _M0FP38username13ipod__moonbit4ipod11preset__str(hp) {
  switch (hp) {
    case 0: {
      return "classic-2007";
    }
    case 1: {
      return "classic-2008";
    }
    case 2: {
      return "classic-2009";
    }
    case 3: {
      return "classic-2008-black";
    }
    default: {
      return "classic-2008-silver";
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod8sel__str(sk) {
  if (sk === 0) {
    return "moment";
  } else {
    return "range";
  }
}
function _M0FP38username13ipod__moonbit4ipod15view__mode__str(vm) {
  switch (vm) {
    case 0: {
      return "flat";
    }
    case 1: {
      return "focus";
    }
    case 2: {
      return "preview";
    }
    case 3: {
      return "ascii";
    }
    default: {
      return "3d";
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod16serialize__model(m, p, i, pb) {
  const parts = [];
  _M0MPC15array5Array4pushGsE(parts, "{");
  const _p = "metadata";
  _M0MPC15array5Array4pushGsE(parts, `\"${_p}\":{`);
  const _p$2 = "title";
  const _p$3 = m.title;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$2}\":\"${_p$3}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$4 = "artist";
  const _p$5 = m.artist;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$4}\":\"${_p$5}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$6 = "album";
  const _p$7 = m.album;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$6}\":\"${_p$7}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$8 = "artwork";
  const _p$9 = m.artwork;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$8}\":\"${_p$9}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$10 = "duration";
  const _p$11 = _M0MPC16double6Double10to__string(m.duration);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$10}\":${_p$11}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$12 = "currentTime";
  const _p$13 = _M0MPC16double6Double10to__string(m.currentTime);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$12}\":${_p$13}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$14 = "rating";
  const _p$15 = _M0MPC13int3Int18to__string_2einner(m.rating, 10);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$14}\":${_p$15}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$16 = "trackNumber";
  const _p$17 = _M0MPC13int3Int18to__string_2einner(m.trackNumber, 10);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$16}\":${_p$17}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$18 = "totalTracks";
  const _p$19 = _M0MPC13int3Int18to__string_2einner(m.totalTracks, 10);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$18}\":${_p$19}`);
  _M0MPC15array5Array4pushGsE(parts, "},");
  const _p$20 = "presentation";
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$20}\":{`);
  const _p$21 = "skinColor";
  const _p$22 = p.skinColor;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$21}\":\"${_p$22}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$23 = "bgColor";
  const _p$24 = p.bgColor;
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$23}\":\"${_p$24}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$25 = "viewMode";
  const _p$26 = _M0FP38username13ipod__moonbit4ipod15view__mode__str(p.viewMode);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$25}\":\"${_p$26}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$27 = "hardwarePreset";
  const _p$28 = _M0FP38username13ipod__moonbit4ipod11preset__str(p.hardwarePreset);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$27}\":\"${_p$28}\"`);
  _M0MPC15array5Array4pushGsE(parts, "},");
  const _p$29 = "interaction";
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$29}\":{`);
  const _p$30 = "interactionModel";
  const _p$31 = _M0FP38username13ipod__moonbit4ipod7im__str(i.interactionModel);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$30}\":\"${_p$31}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$32 = "osScreen";
  const _p$33 = _M0FP38username13ipod__moonbit4ipod7os__str(i.osScreen);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$32}\":\"${_p$33}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$34 = "menuIndex";
  const _p$35 = _M0MPC13int3Int18to__string_2einner(i.menuIndex, 10);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$34}\":${_p$35}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$36 = "osOriginalMenuSplit";
  const _p$37 = _M0MPC16double6Double10to__string(i.osOriginalMenuSplit);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$36}\":${_p$37}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$38 = "isNowPlayingEditable";
  const _p$39 = i.isNowPlayingEditable;
  _M0MPC15array5Array4pushGsE(parts, _p$39 ? `\"${_p$38}\":true` : `\"${_p$38}\":false`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$40 = "isPlaying";
  const _p$41 = i.isPlaying;
  _M0MPC15array5Array4pushGsE(parts, _p$41 ? `\"${_p$40}\":true` : `\"${_p$40}\":false`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$42 = "batteryLevel";
  const _p$43 = _M0MPC16double6Double10to__string(i.batteryLevel);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$42}\":${_p$43}`);
  _M0MPC15array5Array4pushGsE(parts, "},");
  const _p$44 = "playback";
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$44}\":{`);
  const _p$45 = "currentTime";
  const _p$46 = _M0MPC16double6Double10to__string(pb.currentTime);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$45}\":${_p$46}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$47 = "duration";
  const _p$48 = _M0MPC16double6Double10to__string(pb.duration);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$47}\":${_p$48}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$49 = "selectionKind";
  const _p$50 = _M0FP38username13ipod__moonbit4ipod8sel__str(pb.selectionKind);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$49}\":\"${_p$50}\"`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$51 = "rangeStartTime";
  const _p$52 = _M0MPC16double6Double10to__string(pb.rangeStartTime);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$51}\":${_p$52}`);
  _M0MPC15array5Array4pushGsE(parts, ",");
  const _p$53 = "rangeEndTime";
  const _p$54 = _M0MPC16double6Double10to__string(pb.rangeEndTime);
  _M0MPC15array5Array4pushGsE(parts, `\"${_p$53}\":${_p$54}`);
  _M0MPC15array5Array4pushGsE(parts, "}");
  _M0MPC15array5Array4pushGsE(parts, "}");
  let result = "";
  const _bind = parts.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const part = parts[_];
      result = `${result}${part}`;
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0FP38username13ipod__moonbit4ipod9find__str(haystack, needle, start) {
  let i = start;
  while (true) {
    if ((i + needle.length | 0) <= haystack.length) {
      let matched = true;
      let j = 0;
      while (true) {
        if (j < needle.length) {
          const _tmp = i + j | 0;
          $bound_check(haystack, _tmp);
          const _p = haystack.charCodeAt(_tmp);
          const _tmp$2 = j;
          $bound_check(needle, _tmp$2);
          const _p$2 = needle.charCodeAt(_tmp$2);
          if (_p !== _p$2) {
            matched = false;
            j = needle.length;
          }
          j = j + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      if (matched) {
        return i;
      }
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return -1;
}
function _M0FP38username13ipod__moonbit4ipod5s__eq(s, start, v) {
  if ((start + v.length | 0) > s.length) {
    return false;
  } else {
    let i = 0;
    while (true) {
      if (i < v.length) {
        const _tmp = start + i | 0;
        $bound_check(s, _tmp);
        const _p = s.charCodeAt(_tmp);
        const _tmp$2 = i;
        $bound_check(v, _tmp$2);
        const _p$2 = v.charCodeAt(_tmp$2);
        if (_p !== _p$2) {
          return false;
        }
        i = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return true;
  }
}
function _M0FP38username13ipod__moonbit4ipod11field__bool(json, key) {
  const needle = `\"${key}\":`;
  const idx = _M0FP38username13ipod__moonbit4ipod9find__str(json, needle, 0);
  if (idx === -1) {
    return false;
  } else {
    const start = idx + needle.length | 0;
    return (start + 4 | 0) <= json.length && _M0FP38username13ipod__moonbit4ipod5s__eq(json, start, "true");
  }
}
function _M0FP38username13ipod__moonbit4ipod19parse__double__frac(s, i, acc, mult) {
  let _tmp = i;
  let _tmp$2 = acc;
  let _tmp$3 = mult;
  while (true) {
    const i$2 = _tmp;
    const acc$2 = _tmp$2;
    const mult$2 = _tmp$3;
    if (i$2 >= s.length) {
      return acc$2;
    } else {
      $bound_check(s, i$2);
      const c = s.charCodeAt(i$2);
      if (c >= 48 && c <= 57) {
        _tmp = i$2 + 1 | 0;
        _tmp$2 = acc$2 + ((c - 48 | 0) + 0) * mult$2;
        _tmp$3 = mult$2 * 0.1;
        continue;
      } else {
        _tmp = i$2 + 1 | 0;
        continue;
      }
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod18parse__double__int(s, i, acc) {
  let _tmp = i;
  let _tmp$2 = acc;
  while (true) {
    const i$2 = _tmp;
    const acc$2 = _tmp$2;
    let _tmp$3;
    if (i$2 >= s.length) {
      _tmp$3 = true;
    } else {
      $bound_check(s, i$2);
      const _p = s.charCodeAt(i$2);
      const _p$2 = 46;
      _tmp$3 = _p === _p$2;
    }
    if (_tmp$3) {
      return { _0: acc$2, _1: i$2 };
    } else {
      $bound_check(s, i$2);
      const c = s.charCodeAt(i$2);
      if (c >= 48 && c <= 57) {
        _tmp = i$2 + 1 | 0;
        _tmp$2 = acc$2 * 10 + ((c - 48 | 0) + 0);
        continue;
      } else {
        return { _0: acc$2, _1: i$2 };
      }
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod13parse__double(s) {
  if (s.length === 0) {
    return 0;
  } else {
    let sign;
    $bound_check(s, 0);
    const _p = s.charCodeAt(0);
    const _p$2 = 45;
    if (_p === _p$2) {
      sign = -1;
    } else {
      sign = 1;
    }
    let start;
    let _tmp;
    $bound_check(s, 0);
    const _p$3 = s.charCodeAt(0);
    const _p$4 = 45;
    if (_p$3 === _p$4) {
      _tmp = true;
    } else {
      $bound_check(s, 0);
      const _p$5 = s.charCodeAt(0);
      const _p$6 = 43;
      _tmp = _p$5 === _p$6;
    }
    if (_tmp) {
      start = 1;
    } else {
      start = 0;
    }
    const _bind = _M0FP38username13ipod__moonbit4ipod18parse__double__int(s, start, 0);
    const _int_part = _bind._0;
    const _next_i = _bind._1;
    let _tmp$2;
    if (_next_i < s.length) {
      $bound_check(s, _next_i);
      const _p$5 = s.charCodeAt(_next_i);
      const _p$6 = 46;
      _tmp$2 = _p$5 === _p$6;
    } else {
      _tmp$2 = false;
    }
    if (_tmp$2) {
      const frac_part = _M0FP38username13ipod__moonbit4ipod19parse__double__frac(s, _next_i + 1 | 0, 0, 0.1);
      return (_int_part + frac_part) * sign;
    } else {
      return _int_part * sign;
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod15parse__num__val(s, start) {
  let result = "";
  let i = start;
  while (true) {
    let _tmp;
    if (i < s.length) {
      let _tmp$2;
      const _tmp$3 = i;
      $bound_check(s, _tmp$3);
      const _p = s.charCodeAt(_tmp$3);
      const _p$2 = 44;
      if (_p !== _p$2) {
        const _tmp$4 = i;
        $bound_check(s, _tmp$4);
        const _p$3 = s.charCodeAt(_tmp$4);
        const _p$4 = 125;
        _tmp$2 = _p$3 !== _p$4;
      } else {
        _tmp$2 = false;
      }
      _tmp = _tmp$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      const _tmp$2 = result;
      const _tmp$3 = i;
      $bound_check(s, _tmp$3);
      result = `${_tmp$2}${_M0MPC16uint166UInt1618to__string_2einner(s.charCodeAt(_tmp$3), 10)}`;
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FP38username13ipod__moonbit4ipod13parse__double(result);
}
function _M0FP38username13ipod__moonbit4ipod10field__num(json, key) {
  const needle = `\"${key}\":`;
  const idx = _M0FP38username13ipod__moonbit4ipod9find__str(json, needle, 0);
  if (idx === -1) {
    return 0;
  } else {
    const start = idx + needle.length | 0;
    return _M0FP38username13ipod__moonbit4ipod15parse__num__val(json, start);
  }
}
function _M0FP38username13ipod__moonbit4ipod18parse__string__val(s, start) {
  let i = start;
  let result = "";
  while (true) {
    let _tmp;
    if (i < s.length) {
      const _tmp$2 = i;
      $bound_check(s, _tmp$2);
      const _p = s.charCodeAt(_tmp$2);
      const _p$2 = 34;
      _tmp = _p !== _p$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      const _tmp$2 = result;
      const _tmp$3 = i;
      $bound_check(s, _tmp$3);
      result = `${_tmp$2}${_M0MPC16uint166UInt1618to__string_2einner(s.charCodeAt(_tmp$3), 10)}`;
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0FP38username13ipod__moonbit4ipod10field__str(json, key) {
  const needle = `\"${key}\":\"`;
  const idx = _M0FP38username13ipod__moonbit4ipod9find__str(json, needle, 0);
  if (idx === -1) {
    return "";
  } else {
    const start = idx + needle.length | 0;
    return _M0FP38username13ipod__moonbit4ipod18parse__string__val(json, start);
  }
}
function _M0FP38username13ipod__moonbit4ipod12num__to__str(n) {
  return _M0MPC16double6Double10to__string(n);
}
function _M0FP38username13ipod__moonbit4ipod9parse__im(s) {
  switch (s) {
    case "ipod-os": {
      return 1;
    }
    case "ipod-os-original": {
      return 2;
    }
    default: {
      return 0;
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod18parse__int__digits(s, i, acc) {
  let _tmp = i;
  let _tmp$2 = acc;
  while (true) {
    const i$2 = _tmp;
    const acc$2 = _tmp$2;
    if (i$2 >= s.length) {
      return acc$2;
    } else {
      $bound_check(s, i$2);
      const c = s.charCodeAt(i$2);
      if (c >= 48 && c <= 57) {
        _tmp = i$2 + 1 | 0;
        _tmp$2 = (Math.imul(acc$2, 10) | 0) + (c - 48 | 0) | 0;
        continue;
      } else {
        _tmp = i$2 + 1 | 0;
        continue;
      }
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod10parse__int(s) {
  if (s.length === 0) {
    return 0;
  } else {
    let sign;
    $bound_check(s, 0);
    const _p = s.charCodeAt(0);
    const _p$2 = 45;
    if (_p === _p$2) {
      sign = -1;
    } else {
      sign = 1;
    }
    let start;
    let _tmp;
    $bound_check(s, 0);
    const _p$3 = s.charCodeAt(0);
    const _p$4 = 45;
    if (_p$3 === _p$4) {
      _tmp = true;
    } else {
      $bound_check(s, 0);
      const _p$5 = s.charCodeAt(0);
      const _p$6 = 43;
      _tmp = _p$5 === _p$6;
    }
    if (_tmp) {
      start = 1;
    } else {
      start = 0;
    }
    return Math.imul(_M0FP38username13ipod__moonbit4ipod18parse__int__digits(s, start, 0), sign) | 0;
  }
}
function _M0FP38username13ipod__moonbit4ipod6s__sub(s, start, end) {
  let result = "";
  let i = start;
  while (true) {
    if (i < end && i < s.length) {
      const _tmp = result;
      const _tmp$2 = i;
      $bound_check(s, _tmp$2);
      result = `${_tmp}${_M0MPC16uint166UInt1618to__string_2einner(s.charCodeAt(_tmp$2), 10)}`;
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0FP38username13ipod__moonbit4ipod15extract__nested(s, start) {
  let depth = 1;
  let i = start;
  while (true) {
    if (i < s.length && depth > 0) {
      const _tmp = i;
      $bound_check(s, _tmp);
      const _p = s.charCodeAt(_tmp);
      const _p$2 = 123;
      if (_p === _p$2) {
        depth = depth + 1 | 0;
      } else {
        const _tmp$2 = i;
        $bound_check(s, _tmp$2);
        const _p$3 = s.charCodeAt(_tmp$2);
        const _p$4 = 125;
        if (_p$3 === _p$4) {
          depth = depth - 1 | 0;
        }
      }
      if (depth > 0) {
        i = i + 1 | 0;
      }
      continue;
    } else {
      break;
    }
  }
  return i <= start ? "{}" : _M0FP38username13ipod__moonbit4ipod6s__sub(s, start, i);
}
function _M0FP38username13ipod__moonbit4ipod13section__json(json, section) {
  const key = `\"${section}\":{`;
  const idx = _M0FP38username13ipod__moonbit4ipod9find__str(json, key, 0);
  if (idx === -1) {
    return "{}";
  } else {
    const start = idx + key.length | 0;
    return _M0FP38username13ipod__moonbit4ipod15extract__nested(json, start);
  }
}
function _M0FP38username13ipod__moonbit4ipod12parse__inter(json) {
  const sec = _M0FP38username13ipod__moonbit4ipod13section__json(json, "interaction");
  const _tmp = _M0FP38username13ipod__moonbit4ipod9parse__im(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "interactionModel"));
  const _p = _M0FP38username13ipod__moonbit4ipod10field__str(sec, "osScreen");
  return new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp, _p === "now-playing" ? 1 : 0, _M0FP38username13ipod__moonbit4ipod10parse__int(_M0FP38username13ipod__moonbit4ipod12num__to__str(_M0FP38username13ipod__moonbit4ipod10field__num(sec, "menuIndex"))), _M0FP38username13ipod__moonbit4ipod10field__num(sec, "osOriginalMenuSplit"), _M0FP38username13ipod__moonbit4ipod11field__bool(sec, "isNowPlayingEditable"), _M0FP38username13ipod__moonbit4ipod11field__bool(sec, "isPlaying"), _M0FP38username13ipod__moonbit4ipod10field__num(sec, "batteryLevel"));
}
function _M0FP38username13ipod__moonbit4ipod11parse__meta(json) {
  const sec = _M0FP38username13ipod__moonbit4ipod13section__json(json, "metadata");
  return new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "title"), _M0FP38username13ipod__moonbit4ipod10field__str(sec, "artist"), _M0FP38username13ipod__moonbit4ipod10field__str(sec, "album"), _M0FP38username13ipod__moonbit4ipod10field__str(sec, "artwork"), _M0FP38username13ipod__moonbit4ipod10field__num(sec, "duration"), _M0FP38username13ipod__moonbit4ipod10field__num(sec, "currentTime"), _M0FP38username13ipod__moonbit4ipod10parse__int(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "rating")), _M0FP38username13ipod__moonbit4ipod10parse__int(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "trackNumber")), _M0FP38username13ipod__moonbit4ipod10parse__int(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "totalTracks")));
}
function _M0FP38username13ipod__moonbit4ipod9parse__pb(json) {
  const sec = _M0FP38username13ipod__moonbit4ipod13section__json(json, "playback");
  const _tmp = _M0FP38username13ipod__moonbit4ipod10field__num(sec, "currentTime");
  const _tmp$2 = _M0FP38username13ipod__moonbit4ipod10field__num(sec, "duration");
  const _p = _M0FP38username13ipod__moonbit4ipod10field__str(sec, "selectionKind");
  return new _M0TP38username13ipod__moonbit4ipod13PlaybackState(_tmp, _tmp$2, _p === "range" ? 1 : 0, _M0FP38username13ipod__moonbit4ipod10field__num(sec, "rangeStartTime"), _M0FP38username13ipod__moonbit4ipod10field__num(sec, "rangeEndTime"));
}
function _M0FP38username13ipod__moonbit4ipod9parse__hp(s) {
  switch (s) {
    case "classic-2007": {
      return 0;
    }
    case "classic-2009": {
      return 2;
    }
    case "classic-2008-black": {
      return 3;
    }
    case "classic-2008-silver": {
      return 4;
    }
    default: {
      return 1;
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod9parse__vm(s) {
  switch (s) {
    case "focus": {
      return 1;
    }
    case "preview": {
      return 2;
    }
    case "ascii": {
      return 3;
    }
    case "3d": {
      return 4;
    }
    default: {
      return 0;
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod11parse__pres(json) {
  const sec = _M0FP38username13ipod__moonbit4ipod13section__json(json, "presentation");
  return new _M0TP38username13ipod__moonbit4ipod17PresentationState(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "skinColor"), _M0FP38username13ipod__moonbit4ipod10field__str(sec, "bgColor"), _M0FP38username13ipod__moonbit4ipod9parse__vm(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "viewMode")), _M0FP38username13ipod__moonbit4ipod9parse__hp(_M0FP38username13ipod__moonbit4ipod10field__str(sec, "hardwarePreset")));
}
function _M0FP38username13ipod__moonbit4ipod18deserialize__model(json) {
  const m = _M0FP38username13ipod__moonbit4ipod11parse__meta(json);
  const p = _M0FP38username13ipod__moonbit4ipod11parse__pres(json);
  const i = _M0FP38username13ipod__moonbit4ipod12parse__inter(json);
  const pb = _M0FP38username13ipod__moonbit4ipod9parse__pb(json);
  return new _M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE2Ok(new _M0TP38username13ipod__moonbit4ipod9IpodModel(m, p, i, pb));
}
function _M0FP38username13ipod__moonbit4ipod19get__marquee__frame(elapsed_ms, cycle_duration_ms) {
  if (cycle_duration_ms <= 0) {
    return 0;
  } else {
    const progress = _M0IPC16double6DoublePB3Mod3mod(elapsed_ms, cycle_duration_ms) / cycle_duration_ms;
    return progress * cycle_duration_ms * -0.05;
  }
}
function _M0FP38username13ipod__moonbit4ipod33get__marquee__cycle__duration__ms(text_width, container_width, gap_width) {
  if (text_width <= container_width) {
    return 0;
  } else {
    const total_scroll = text_width + gap_width;
    return total_scroll / 50 * 1000;
  }
}
function _M0FP38username13ipod__moonbit4ipod6reduce(model, event_tag, event_data) {
  switch (event_tag) {
    case "UPDATE_TITLE": {
      const _tmp = model.metadata;
      const meta = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(event_data, _tmp.artist, _tmp.album, _tmp.artwork, _tmp.duration, _tmp.currentTime, _tmp.rating, _tmp.trackNumber, _tmp.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_ARTIST": {
      const _tmp$2 = model.metadata;
      const meta$2 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$2.title, event_data, _tmp$2.album, _tmp$2.artwork, _tmp$2.duration, _tmp$2.currentTime, _tmp$2.rating, _tmp$2.trackNumber, _tmp$2.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$2, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_ALBUM": {
      const _tmp$3 = model.metadata;
      const meta$3 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$3.title, _tmp$3.artist, event_data, _tmp$3.artwork, _tmp$3.duration, _tmp$3.currentTime, _tmp$3.rating, _tmp$3.trackNumber, _tmp$3.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$3, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_ARTWORK": {
      const _tmp$4 = model.metadata;
      const meta$4 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$4.title, _tmp$4.artist, _tmp$4.album, event_data, _tmp$4.duration, _tmp$4.currentTime, _tmp$4.rating, _tmp$4.trackNumber, _tmp$4.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$4, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_DURATION": {
      const d = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _tmp$5 = model.metadata;
      const meta$5 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$5.title, _tmp$5.artist, _tmp$5.album, _tmp$5.artwork, d, _tmp$5.currentTime, _tmp$5.rating, _tmp$5.trackNumber, _tmp$5.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$5, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_CURRENT_TIME": {
      const t = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _bind = model.playback;
      const pb = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(t, _bind.duration, _bind.selectionKind, _bind.rangeStartTime, _bind.rangeEndTime);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, model.interaction, pb)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_RATING": {
      const r = _M0FP38username13ipod__moonbit4ipod10parse__int(event_data);
      const _tmp$6 = model.metadata;
      const meta$6 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$6.title, _tmp$6.artist, _tmp$6.album, _tmp$6.artwork, _tmp$6.duration, _tmp$6.currentTime, r, _tmp$6.trackNumber, _tmp$6.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$6, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_TRACK_NUMBER": {
      const tn = _M0FP38username13ipod__moonbit4ipod10parse__int(event_data);
      const _tmp$7 = model.metadata;
      const meta$7 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$7.title, _tmp$7.artist, _tmp$7.album, _tmp$7.artwork, _tmp$7.duration, _tmp$7.currentTime, _tmp$7.rating, tn, _tmp$7.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$7, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_TOTAL_TRACKS": {
      const tt = _M0FP38username13ipod__moonbit4ipod10parse__int(event_data);
      const _tmp$8 = model.metadata;
      const meta$8 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$8.title, _tmp$8.artist, _tmp$8.album, _tmp$8.artwork, _tmp$8.duration, _tmp$8.currentTime, _tmp$8.rating, _tmp$8.trackNumber, tt);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$8, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "SET_VIEW_MODE": {
      let vm;
      switch (event_data) {
        case "focus": {
          vm = 1;
          break;
        }
        case "preview": {
          vm = 2;
          break;
        }
        case "ascii": {
          vm = 3;
          break;
        }
        case "3d": {
          vm = 4;
          break;
        }
        default: {
          vm = 0;
        }
      }
      const _bind$2 = model.presentation;
      const pres = new _M0TP38username13ipod__moonbit4ipod17PresentationState(_bind$2.skinColor, _bind$2.bgColor, vm, _bind$2.hardwarePreset);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, pres, model.interaction, model.playback), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_SKIN_COLOR": {
      const _bind$3 = model.presentation;
      const pres$2 = new _M0TP38username13ipod__moonbit4ipod17PresentationState(event_data, _bind$3.bgColor, _bind$3.viewMode, _bind$3.hardwarePreset);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, pres$2, model.interaction, model.playback), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_BG_COLOR": {
      const _bind$4 = model.presentation;
      const pres$3 = new _M0TP38username13ipod__moonbit4ipod17PresentationState(_bind$4.skinColor, event_data, _bind$4.viewMode, _bind$4.hardwarePreset);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, pres$3, model.interaction, model.playback), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_HARDWARE_PRESET": {
      let hp;
      switch (event_data) {
        case "classic-2007": {
          hp = 0;
          break;
        }
        case "classic-2009": {
          hp = 2;
          break;
        }
        case "classic-2008-black": {
          hp = 3;
          break;
        }
        case "classic-2008-silver": {
          hp = 4;
          break;
        }
        default: {
          hp = 1;
        }
      }
      let color;
      if (hp === 4) {
        color = "#C0C0C0";
      } else {
        color = "#111111";
      }
      const _bind$5 = model.presentation;
      const pres$4 = new _M0TP38username13ipod__moonbit4ipod17PresentationState(color, _bind$5.bgColor, _bind$5.viewMode, hp);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, pres$4, model.interaction, model.playback), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_INTERACTION_MODEL": {
      let im;
      switch (event_data) {
        case "ipod-os": {
          im = 1;
          break;
        }
        case "ipod-os-original": {
          im = 2;
          break;
        }
        default: {
          im = 0;
        }
      }
      const _tmp$9 = model.interaction;
      const inter = new _M0TP38username13ipod__moonbit4ipod16InteractionState(im, _tmp$9.osScreen, _tmp$9.menuIndex, _tmp$9.osOriginalMenuSplit, _tmp$9.isNowPlayingEditable, _tmp$9.isPlaying, _tmp$9.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter, model.playback), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_OS_SCREEN": {
      const screen = event_data === "now-playing" ? 1 : 0;
      const _tmp$10 = model.interaction;
      const inter$2 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$10.interactionModel, screen, _tmp$10.menuIndex, _tmp$10.osOriginalMenuSplit, _tmp$10.isNowPlayingEditable, _tmp$10.isPlaying, _tmp$10.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$2, model.playback), _1: [] };
    }
    case "SET_OS_MENU_INDEX": {
      const idx = _M0FP38username13ipod__moonbit4ipod10parse__int(event_data);
      const _tmp$11 = model.interaction;
      const inter$3 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$11.interactionModel, _tmp$11.osScreen, idx, _tmp$11.osOriginalMenuSplit, _tmp$11.isNowPlayingEditable, _tmp$11.isPlaying, _tmp$11.batteryLevel);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$3, model.playback)), _1: [] };
    }
    case "CYCLE_OS_MENU": {
      const delta = _M0FP38username13ipod__moonbit4ipod10parse__int(event_data);
      const _tmp$12 = model.interaction;
      const inter$4 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$12.interactionModel, _tmp$12.osScreen, model.interaction.menuIndex + delta | 0, _tmp$12.osOriginalMenuSplit, _tmp$12.isNowPlayingEditable, _tmp$12.isPlaying, _tmp$12.batteryLevel);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$4, model.playback)), _1: [] };
    }
    case "SET_OS_ORIGINAL_MENU_SPLIT": {
      const split = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _tmp$13 = model.interaction;
      const inter$5 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$13.interactionModel, _tmp$13.osScreen, _tmp$13.menuIndex, split, _tmp$13.isNowPlayingEditable, _tmp$13.isPlaying, _tmp$13.batteryLevel);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$5, model.playback)), _1: ["PERSIST_UI_STATE"] };
    }
    case "SET_OS_NOW_PLAYING_EDITABLE": {
      const editable = event_data === "true" || event_data === "1";
      const _tmp$14 = model.interaction;
      const inter$6 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$14.interactionModel, _tmp$14.osScreen, _tmp$14.menuIndex, _tmp$14.osOriginalMenuSplit, editable, _tmp$14.isPlaying, _tmp$14.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$6, model.playback), _1: [] };
    }
    case "TOGGLE_OS_NOW_PLAYING_EDITABLE": {
      const _tmp$15 = model.interaction;
      const inter$7 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$15.interactionModel, _tmp$15.osScreen, _tmp$15.menuIndex, _tmp$15.osOriginalMenuSplit, !model.interaction.isNowPlayingEditable, _tmp$15.isPlaying, _tmp$15.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$7, model.playback), _1: [] };
    }
    case "SET_IS_PLAYING": {
      const playing = event_data === "true" || event_data === "1";
      const _tmp$16 = model.interaction;
      const inter$8 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$16.interactionModel, _tmp$16.osScreen, _tmp$16.menuIndex, _tmp$16.osOriginalMenuSplit, _tmp$16.isNowPlayingEditable, playing, _tmp$16.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$8, model.playback), _1: [] };
    }
    case "TOGGLE_IS_PLAYING": {
      const _tmp$17 = model.interaction;
      const inter$9 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$17.interactionModel, _tmp$17.osScreen, _tmp$17.menuIndex, _tmp$17.osOriginalMenuSplit, _tmp$17.isNowPlayingEditable, !model.interaction.isPlaying, _tmp$17.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$9, model.playback), _1: [] };
    }
    case "SET_BATTERY_LEVEL": {
      const level = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _tmp$18 = model.interaction;
      const inter$10 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$18.interactionModel, _tmp$18.osScreen, _tmp$18.menuIndex, _tmp$18.osOriginalMenuSplit, _tmp$18.isNowPlayingEditable, _tmp$18.isPlaying, level);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$10, model.playback)), _1: [] };
    }
    case "SET_SELECTION_KIND": {
      let kind;
      if (event_data === "range") {
        kind = 1;
      } else {
        kind = 0;
      }
      const _bind$6 = model.playback;
      const pb$2 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(_bind$6.currentTime, _bind$6.duration, kind, _bind$6.rangeStartTime, _bind$6.rangeEndTime);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, model.interaction, pb$2), _1: [] };
    }
    case "SET_RANGE_START_TIME": {
      const t$2 = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _bind$7 = model.playback;
      const pb$3 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(_bind$7.currentTime, _bind$7.duration, _bind$7.selectionKind, t$2, _bind$7.rangeEndTime);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, model.interaction, pb$3)), _1: [] };
    }
    case "SET_RANGE_END_TIME": {
      const t$3 = _M0FP38username13ipod__moonbit4ipod13parse__double(event_data);
      const _bind$8 = model.playback;
      const pb$4 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(_bind$8.currentTime, _bind$8.duration, _bind$8.selectionKind, _bind$8.rangeStartTime, t$3);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, model.interaction, pb$4)), _1: [] };
    }
    case "APPLY_SONG_SNAPSHOT": {
      const _bind$9 = _M0FP38username13ipod__moonbit4ipod18deserialize__model(event_data);
      if (_bind$9.$tag === 1) {
        const _Ok = _bind$9;
        const _m = _Ok._0;
        return { _0: _m, _1: ["PERSIST_METADATA", "PERSIST_UI_STATE"] };
      } else {
        return { _0: model, _1: [] };
      }
    }
    case "RESET_MODEL": {
      return { _0: _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS419, _1: ["PERSIST_METADATA", "PERSIST_UI_STATE"] };
    }
    case "RESTORE_MODEL": {
      const _bind$10 = _M0FP38username13ipod__moonbit4ipod18deserialize__model(event_data);
      if (_bind$10.$tag === 1) {
        const _Ok = _bind$10;
        const _m = _Ok._0;
        return { _0: _m, _1: [] };
      } else {
        return { _0: model, _1: [] };
      }
    }
    default: {
      return { _0: model, _1: [] };
    }
  }
}
function _M0FP38username13ipod__moonbit4ipod9hex__byte(s, pos) {
  $bound_check(s, pos);
  const c = s.charCodeAt(pos);
  return c >= 48 && c <= 57 ? c - 48 | 0 : c >= 65 && c <= 70 ? c - 55 | 0 : c >= 97 && c <= 102 ? c - 87 | 0 : 0;
}
function _M0FP38username13ipod__moonbit4ipod18parse__hex__double(hex, pos) {
  const h = _M0FP38username13ipod__moonbit4ipod9hex__byte(hex, pos);
  const l = _M0FP38username13ipod__moonbit4ipod9hex__byte(hex, pos + 1 | 0);
  return (h + 0) * 16 + (l + 0);
}
function _M0FP38username13ipod__moonbit4ipod16srgb__to__linear(c) {
  return c <= 0.03928 ? c / 12.92 : (c + 0.055) / 1.055 * ((c + 0.055) / 1.055);
}
function _M0FP38username13ipod__moonbit4ipod19relative__luminance(hex) {
  const r = _M0FP38username13ipod__moonbit4ipod18parse__hex__double(hex, 1);
  const g = _M0FP38username13ipod__moonbit4ipod18parse__hex__double(hex, 3);
  const b = _M0FP38username13ipod__moonbit4ipod18parse__hex__double(hex, 5);
  const r$2 = _M0FP38username13ipod__moonbit4ipod16srgb__to__linear(r / 255);
  const g$2 = _M0FP38username13ipod__moonbit4ipod16srgb__to__linear(g / 255);
  const b$2 = _M0FP38username13ipod__moonbit4ipod16srgb__to__linear(b / 255);
  return 0.2126 * r$2 + 0.7152 * g$2 + 0.0722 * b$2;
}
function _M0FP38username13ipod__moonbit4ipod8is__dark(hex) {
  return _M0FP38username13ipod__moonbit4ipod19relative__luminance(hex) < 0.5;
}
function _M0FP38username13ipod__moonbit4ipod13derive__wheel(case_hex) {
  const lum = _M0FP38username13ipod__moonbit4ipod19relative__luminance(case_hex);
  return lum < 0.18 ? _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS431 : lum < 0.45 ? _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS434 : _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS437;
}
function _M0FP48username13ipod__moonbit3cmd4main20default__model__json() {
  const m = _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS419;
  return _M0FP38username13ipod__moonbit4ipod16serialize__model(m.metadata, m.presentation, m.interaction, m.playback);
}
function _M0FP48username13ipod__moonbit3cmd4main13effects__json(effects, i, acc) {
  let _tmp = i;
  let _tmp$2 = acc;
  while (true) {
    const i$2 = _tmp;
    const acc$2 = _tmp$2;
    if (i$2 >= effects.length) {
      return `${acc$2}]`;
    } else {
      const sep = i$2 === 0 ? "" : ",";
      _tmp = i$2 + 1 | 0;
      _tmp$2 = `${acc$2}${sep}\"${_M0MPC15array5Array2atGRP38username13ipod__moonbit4ipod11AppleFinishE(effects, i$2)}\"`;
      continue;
    }
  }
}
function _M0FP48username13ipod__moonbit3cmd4main17effects__to__json(effects) {
  return _M0FP48username13ipod__moonbit3cmd4main13effects__json(effects, 0, "[");
}
function _M0FP48username13ipod__moonbit3cmd4main13reduce__model(model_json, event_tag, event_data) {
  const _bind = _M0FP38username13ipod__moonbit4ipod18deserialize__model(model_json);
  let m;
  if (_bind.$tag === 1) {
    const _Ok = _bind;
    m = _Ok._0;
  } else {
    m = _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS419;
  }
  const _bind$2 = _M0FP38username13ipod__moonbit4ipod6reduce(m, event_tag, event_data);
  const _next = _bind$2._0;
  const _effects = _bind$2._1;
  const model_json$2 = _M0FP38username13ipod__moonbit4ipod16serialize__model(_next.metadata, _next.presentation, _next.interaction, _next.playback);
  const effects_json = _M0FP48username13ipod__moonbit3cmd4main17effects__to__json(_effects);
  return `{\"model\":${model_json$2},\"effects\":${effects_json}}`;
}
function _M0FP48username13ipod__moonbit3cmd4main16finish__to__json(f, i, acc) {
  let _tmp = i;
  let _tmp$2 = acc;
  while (true) {
    const i$2 = _tmp;
    const acc$2 = _tmp$2;
    if (i$2 >= f.length) {
      return `${acc$2}]`;
    } else {
      const sep = i$2 === 0 ? "" : ",";
      _tmp = i$2 + 1 | 0;
      _tmp$2 = `${acc$2}${sep}{\"label\":\"${_M0MPC15array5Array2atGRP38username13ipod__moonbit4ipod11AppleFinishE(f, i$2).label}\",\"hex\":\"${_M0MPC15array5Array2atGRP38username13ipod__moonbit4ipod11AppleFinishE(f, i$2).hex}\"}`;
      continue;
    }
  }
}
function _M0FP48username13ipod__moonbit3cmd4main24get__authentic__finishes() {
  const f = [_M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS420, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS421, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS422, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS423, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS424, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS425, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS426, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS427, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS428];
  return _M0FP48username13ipod__moonbit3cmd4main16finish__to__json(f, 0, "[");
}
function _M0FP48username13ipod__moonbit3cmd4main18gradient__to__json(g) {
  return `{\"from\":\"${g.from}\",\"via\":\"${g.via}\",\"to\":\"${g.to}\"}`;
}
function _M0FP48username13ipod__moonbit3cmd4main19derive__wheel__json(case_hex) {
  const d = _M0FP38username13ipod__moonbit4ipod13derive__wheel(case_hex);
  return `{\"labelColor\":\"${d.labelColor}\",\"border\":\"${d.border}\",\"centerBorder\":\"${d.centerBorder}\",\"gradient\":${_M0FP48username13ipod__moonbit3cmd4main18gradient__to__json(d.gradient)},\"centerGradient\":${_M0FP48username13ipod__moonbit3cmd4main18gradient__to__json(d.centerGradient)}}`;
}
function _M0FP48username13ipod__moonbit3cmd4main18marquee__cycle__ms(text_width, container_width, gap_width) {
  return _M0FP38username13ipod__moonbit4ipod33get__marquee__cycle__duration__ms(text_width, container_width, gap_width);
}
function _M0FP48username13ipod__moonbit3cmd4main14marquee__frame(elapsed_ms, cycle_duration_ms) {
  return _M0FP38username13ipod__moonbit4ipod19get__marquee__frame(elapsed_ms, cycle_duration_ms);
}
function _M0FP48username13ipod__moonbit3cmd4main15marquee__needed(text_width, container_width) {
  return text_width > container_width;
}
function _M0FP48username13ipod__moonbit3cmd4main15color__is__dark(hex) {
  return _M0FP38username13ipod__moonbit4ipod8is__dark(hex);
}
export { _M0FP48username13ipod__moonbit3cmd4main20default__model__json as default_model_json, _M0FP48username13ipod__moonbit3cmd4main13reduce__model as reduce_model, _M0FP48username13ipod__moonbit3cmd4main24get__authentic__finishes as get_authentic_finishes, _M0FP48username13ipod__moonbit3cmd4main19derive__wheel__json as derive_wheel_json, _M0FP48username13ipod__moonbit3cmd4main18marquee__cycle__ms as marquee_cycle_ms, _M0FP48username13ipod__moonbit3cmd4main14marquee__frame as marquee_frame, _M0FP48username13ipod__moonbit3cmd4main15marquee__needed as marquee_needed, _M0FP48username13ipod__moonbit3cmd4main15color__is__dark as color_is_dark }
