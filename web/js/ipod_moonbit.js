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
function _M0TP38username13ipod__moonbit4ipod15WheelDerivation(param0, param1, param2, param3) {
  this.labelColor = param0;
  this.borderColor = param1;
  this.centerBorder = param2;
  this.centerGradient = param3;
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
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
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS193 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata("Strobe", "deadmau5", "For Lack of a Better Name", "", 154, 0, 0, 1, 10);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS194 = new _M0TP38username13ipod__moonbit4ipod17PresentationState("#111111", "#1a1a1a", 0, 1);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS195 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(0, 0, 0, 0.55, false, false, 0.85);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS196 = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(0, 154, 0, 0, 15);
const _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS197 = new _M0TP38username13ipod__moonbit4ipod9IpodModel(_M0FP38username13ipod__moonbit4ipod14default__modelN6recordS193, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS194, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS195, _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS196);
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS198 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Graphite", "#111111");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS199 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Silver", "#C0C0C0");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS200 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Starlight", "#F0E6D3");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS201 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Midnight", "#2B2D42");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS202 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Blue", "#2C5F7C");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS203 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Pink", "#E8B4B8");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS204 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Purple", "#5B4A7A");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS205 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Red", "#B22222");
const _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS206 = new _M0TP38username13ipod__moonbit4ipod11AppleFinish("Green", "#4A7C59");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS207 = new _M0TP38username13ipod__moonbit4ipod15WheelDerivation("#FFFFFF", "#555555", "#444444", "#666666");
const _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS208 = new _M0TP38username13ipod__moonbit4ipod15WheelDerivation("#333333", "#999999", "#BBBBBB", "#CCCCCC");
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
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
function _M0FP38username13ipod__moonbit4ipod16serialize__model(model) {
  const _p = "title";
  const _p$2 = model.metadata.title;
  const _tmp = `\"${_p}\":\"${_p$2}\"`;
  const _p$3 = "artist";
  const _p$4 = model.metadata.artist;
  const _tmp$2 = `\"${_p$3}\":\"${_p$4}\"`;
  const _p$5 = "album";
  const _p$6 = model.metadata.album;
  const _tmp$3 = `\"${_p$5}\":\"${_p$6}\"`;
  const _p$7 = "artwork";
  const _p$8 = model.metadata.artwork;
  const _tmp$4 = `\"${_p$7}\":\"${_p$8}\"`;
  const _p$9 = "duration";
  const _p$10 = _M0MPC16double6Double10to__string(model.metadata.duration);
  const _tmp$5 = `\"${_p$9}\":\"${_p$10}\"`;
  const _p$11 = "currentTime";
  const _p$12 = _M0MPC16double6Double10to__string(model.metadata.currentTime);
  const _tmp$6 = `\"${_p$11}\":\"${_p$12}\"`;
  const _p$13 = "rating";
  const _p$14 = _M0MPC13int3Int18to__string_2einner(model.metadata.rating, 10);
  const _tmp$7 = `\"${_p$13}\":\"${_p$14}\"`;
  const _p$15 = "trackNumber";
  const _p$16 = _M0MPC13int3Int18to__string_2einner(model.metadata.trackNumber, 10);
  const _tmp$8 = `\"${_p$15}\":\"${_p$16}\"`;
  const _p$17 = "totalTracks";
  const _p$18 = _M0MPC13int3Int18to__string_2einner(model.metadata.totalTracks, 10);
  const _tmp$9 = `\"${_p$17}\":\"${_p$18}\"`;
  const _p$19 = "skinColor";
  const _p$20 = model.metadata.title;
  const _tmp$10 = `\"${_p$19}\":\"${_p$20}\"`;
  const _p$21 = "bgColor";
  const _p$22 = model.metadata.artist;
  return `{${_tmp},${_tmp$2},${_tmp$3},${_tmp$4},${_tmp$5},${_tmp$6},${_tmp$7},${_tmp$8},${_tmp$9},${_tmp$10},${`\"${_p$21}\":\"${_p$22}\"`}}`;
}
function _M0FP38username13ipod__moonbit4ipod18deserialize__model(_json) {
  return new _M0DTPC16result6ResultGRP38username13ipod__moonbit4ipod9IpodModelsE2Ok(_M0FP38username13ipod__moonbit4ipod14default__modelN6recordS197);
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
      const _tmp$5 = model.metadata;
      const meta$5 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$5.title, _tmp$5.artist, _tmp$5.album, _tmp$5.artwork, model.metadata.duration, _tmp$5.currentTime, _tmp$5.rating, _tmp$5.trackNumber, _tmp$5.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$5, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_CURRENT_TIME": {
      const _bind = model.playback;
      const pb = new _M0TP38username13ipod__moonbit4ipod13PlaybackState(model.playback.currentTime, _bind.duration, _bind.selectionKind, _bind.rangeStartTime, _bind.rangeEndTime);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, model.interaction, pb)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_RATING": {
      const _tmp$6 = model.metadata;
      const meta$6 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$6.title, _tmp$6.artist, _tmp$6.album, _tmp$6.artwork, _tmp$6.duration, _tmp$6.currentTime, model.metadata.rating, _tmp$6.trackNumber, _tmp$6.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$6, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_TRACK_NUMBER": {
      const _tmp$7 = model.metadata;
      const meta$7 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$7.title, _tmp$7.artist, _tmp$7.album, _tmp$7.artwork, _tmp$7.duration, _tmp$7.currentTime, _tmp$7.rating, model.metadata.trackNumber, _tmp$7.totalTracks);
      return { _0: _M0FP38username13ipod__moonbit4ipod16normalize__model(new _M0TP38username13ipod__moonbit4ipod9IpodModel(meta$7, model.presentation, model.interaction, model.playback)), _1: ["PERSIST_METADATA"] };
    }
    case "UPDATE_TOTAL_TRACKS": {
      const _tmp$8 = model.metadata;
      const meta$8 = new _M0TP38username13ipod__moonbit4ipod12SongMetadata(_tmp$8.title, _tmp$8.artist, _tmp$8.album, _tmp$8.artwork, _tmp$8.duration, _tmp$8.currentTime, _tmp$8.rating, _tmp$8.trackNumber, model.metadata.totalTracks);
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
    case "TOGGLE_IS_PLAYING": {
      const _tmp$10 = model.interaction;
      const inter$2 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$10.interactionModel, _tmp$10.osScreen, _tmp$10.menuIndex, _tmp$10.osOriginalMenuSplit, _tmp$10.isNowPlayingEditable, !model.interaction.isPlaying, _tmp$10.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$2, model.playback), _1: [] };
    }
    case "SET_OS_SCREEN": {
      const screen = event_data === "now-playing" ? 1 : 0;
      const _tmp$11 = model.interaction;
      const inter$3 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$11.interactionModel, screen, _tmp$11.menuIndex, _tmp$11.osOriginalMenuSplit, _tmp$11.isNowPlayingEditable, _tmp$11.isPlaying, _tmp$11.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$3, model.playback), _1: [] };
    }
    case "SET_BATTERY_LEVEL": {
      const next = _M0FP38username13ipod__moonbit4ipod16normalize__model(model);
      return { _0: next, _1: [] };
    }
    case "SET_OS_MENU_INDEX": {
      const _tmp$12 = model.interaction;
      const inter$4 = new _M0TP38username13ipod__moonbit4ipod16InteractionState(_tmp$12.interactionModel, _tmp$12.osScreen, model.interaction.menuIndex, _tmp$12.osOriginalMenuSplit, _tmp$12.isNowPlayingEditable, _tmp$12.isPlaying, _tmp$12.batteryLevel);
      return { _0: new _M0TP38username13ipod__moonbit4ipod9IpodModel(model.metadata, model.presentation, inter$4, model.playback), _1: [] };
    }
    case "RESET_MODEL": {
      return { _0: _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS197, _1: ["PERSIST_METADATA", "PERSIST_UI_STATE"] };
    }
    case "RESTORE_MODEL": {
      const _bind$6 = _M0FP38username13ipod__moonbit4ipod18deserialize__model(event_data);
      if (_bind$6.$tag === 1) {
        const _Ok = _bind$6;
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
  return _M0FP38username13ipod__moonbit4ipod8is__dark(case_hex) ? _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS207 : _M0FP38username13ipod__moonbit4ipod13derive__wheelN6recordS208;
}
function _M0FP48username13ipod__moonbit3cmd4main20default__model__json() {
  return _M0FP38username13ipod__moonbit4ipod16serialize__model(_M0FP38username13ipod__moonbit4ipod14default__modelN6recordS197);
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
    m = _M0FP38username13ipod__moonbit4ipod14default__modelN6recordS197;
  }
  const _bind$2 = _M0FP38username13ipod__moonbit4ipod6reduce(m, event_tag, event_data);
  const _next = _bind$2._0;
  const _effects = _bind$2._1;
  const model_json$2 = _M0FP38username13ipod__moonbit4ipod16serialize__model(_next);
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
  const f = [_M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS198, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS199, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS200, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS201, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS202, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS203, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS204, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS205, _M0FP38username13ipod__moonbit4ipod19authentic__finishesN6recordS206];
  return _M0FP48username13ipod__moonbit3cmd4main16finish__to__json(f, 0, "[");
}
function _M0FP48username13ipod__moonbit3cmd4main19derive__wheel__json(case_hex) {
  const d = _M0FP38username13ipod__moonbit4ipod13derive__wheel(case_hex);
  return `{\"labelColor\":\"${d.labelColor}\",\"borderColor\":\"${d.borderColor}\",\"centerBorder\":\"${d.centerBorder}\",\"centerGradient\":\"${d.centerGradient}\"}`;
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
