const noop = {
  isNoop: true,
};

const randomColor = () => {
  const num = Math.floor(Math.random() * 256 * 256 * 256);
  return `#${num.toString(16).padStart(6, "0")}`;
};

export const blockSwitches = {
  motion_turnright: [
    noop,
    {
      opcode: "motion_turnleft",
    },
  ],
  motion_turnleft: [
    {
      opcode: "motion_turnright",
    },
    noop,
  ],
  motion_setx: [
    noop,
    {
      opcode: "motion_changexby",
      remapInputName: {
        X: "DX",
      },
    },
    {
      opcode: "motion_sety",
      remapInputName: {
        X: "Y",
      },
    },
    {
      opcode: "motion_changeyby",
      remapInputName: {
        X: "DY",
      },
    },
  ],
  motion_changexby: [
    {
      opcode: "motion_setx",
      remapInputName: {
        DX: "X",
      },
    },
    noop,
    {
      opcode: "motion_sety",
      remapInputName: {
        DX: "Y",
      },
    },
    {
      opcode: "motion_changeyby",
      remapInputName: {
        DX: "DY",
      },
    },
  ],
  motion_sety: [
    {
      opcode: "motion_setx",
      remapInputName: {
        Y: "X",
      },
    },
    {
      opcode: "motion_changexby",
      remapInputName: {
        Y: "DX",
      },
    },
    noop,
    {
      opcode: "motion_changeyby",
      remapInputName: {
        Y: "DY",
      },
    },
  ],
  motion_changeyby: [
    {
      opcode: "motion_setx",
      remapInputName: {
        DY: "X",
      },
    },
    {
      opcode: "motion_changexby",
      remapInputName: {
        DY: "DX",
      },
    },
    {
      opcode: "motion_sety",
      remapInputName: {
        DY: "Y",
      },
    },
    noop,
  ],
  motion_xposition: [
    noop,
    {
      opcode: "motion_yposition",
    },
  ],
  motion_yposition: [
    {
      opcode: "motion_xposition",
    },
    noop,
  ],
  looks_seteffectto: [
    noop,
    {
      opcode: "looks_changeeffectby",
      remapInputName: {
        VALUE: "CHANGE",
      },
    },
  ],
  looks_changeeffectby: [
    {
      opcode: "looks_seteffectto",
      remapInputName: {
        CHANGE: "VALUE",
      },
    },
    noop,
  ],
  looks_setsizeto: [
    noop,
    {
      opcode: "looks_changesizeby",
      remapInputName: {
        SIZE: "CHANGE",
      },
    },
  ],
  looks_changesizeby: [
    {
      opcode: "looks_setsizeto",
      remapInputName: {
        CHANGE: "SIZE",
      },
    },
    noop,
  ],
  looks_costumenumbername: [
    noop,
    {
      opcode: "looks_backdropnumbername",
    },
  ],
  looks_backdropnumbername: [
    {
      opcode: "looks_costumenumbername",
    },
    noop,
  ],
  looks_show: [
    noop,
    {
      opcode: "looks_hide",
    },
  ],
  looks_hide: [
    {
      opcode: "looks_show",
    },
    noop,
  ],
  looks_nextcostume: [
    noop,
    {
      opcode: "looks_nextbackdrop",
    },
  ],
  looks_nextbackdrop: [
    {
      opcode: "looks_nextcostume",
    },
    noop,
  ],
  looks_say: [
    noop,
    {
      opcode: "looks_sayforsecs",
      createInputs: {
        SECS: {
          shadowType: "math_number",
          value: "2",
        },
      },
    },
    {
      opcode: "looks_think",
    },
    {
      opcode: "looks_thinkforsecs",
      createInputs: {
        SECS: {
          shadowType: "math_number",
          value: "2",
        },
      },
    },
  ],
  looks_think: [
    {
      opcode: "looks_say",
    },
    {
      opcode: "looks_sayforsecs",
      createInputs: {
        SECS: {
          shadowType: "math_number",
          value: "2",
        },
      },
    },
    noop,
    {
      opcode: "looks_thinkforsecs",
      createInputs: {
        SECS: {
          shadowType: "math_number",
          value: "2",
        },
      },
    },
  ],
  looks_sayforsecs: [
    {
      opcode: "looks_say",
      splitInputs: ["SECS"],
    },
    {
      opcode: "looks_think",
      splitInputs: ["SECS"],
    },
    noop,
    {
      opcode: "looks_thinkforsecs",
    },
  ],
  looks_thinkforsecs: [
    {
      opcode: "looks_say",
      splitInputs: ["SECS"],
    },
    {
      opcode: "looks_think",
      splitInputs: ["SECS"],
    },
    {
      opcode: "looks_sayforsecs",
    },
    noop,
  ],
  looks_switchbackdropto: [
    noop,
    {
      opcode: "looks_switchbackdroptoandwait",
    },
  ],
  looks_switchbackdroptoandwait: [
    {
      opcode: "looks_switchbackdropto",
    },
    noop,
  ],
  looks_gotofrontback: [
    noop,
    {
      opcode: "looks_goforwardbackwardlayers",
      remapInputName: {
        FRONT_BACK: "FORWARD_BACKWARD",
      },
      mapFieldValues: {
        FRONT_BACK: {
          front: "forward",
          back: "backward",
        },
      },
      createInputs: {
        NUM: {
          shadowType: "math_integer",
          value: "1",
        },
      },
    },
  ],
  looks_goforwardbackwardlayers: [
    {
      opcode: "looks_gotofrontback",
      splitInputs: ["NUM"],
      remapInputName: {
        FORWARD_BACKWARD: "FRONT_BACK",
      },
      mapFieldValues: {
        FORWARD_BACKWARD: {
          forward: "front",
          backward: "back",
        },
      },
    },
    noop,
  ],
  sound_play: [
    noop,
    {
      opcode: "sound_playuntildone",
    },
  ],
  sound_playuntildone: [
    {
      opcode: "sound_play",
    },
    noop,
  ],
  sound_seteffectto: [
    noop,
    {
      opcode: "sound_changeeffectby",
    },
  ],
  sound_changeeffectby: [
    {
      opcode: "sound_seteffectto",
    },
    noop,
  ],
  sound_setvolumeto: [
    noop,
    {
      opcode: "sound_changevolumeby",
    },
  ],
  sound_changevolumeby: [
    {
      opcode: "sound_setvolumeto",
    },
    noop,
  ],
  event_broadcast: [
    noop,
    {
      opcode: "event_broadcastandwait",
    },
  ],
  event_broadcastandwait: [
    {
      opcode: "event_broadcast",
    },
    noop,
  ],
  control_if: [
    noop,
    {
      opcode: "control_if_else",
    },
  ],
  control_if_else: [
    {
      opcode: "control_if",
      splitInputs: ["SUBSTACK2"],
    },
    noop,
  ],
  control_repeat_until: [
    noop,
    {
      opcode: "control_wait_until",
      splitInputs: ["SUBSTACK"],
    },
    {
      opcode: "control_forever",
      splitInputs: ["CONDITION"],
    },
  ],
  control_forever: [
    {
      opcode: "control_repeat_until",
    },
    noop,
  ],
  control_wait_until: [
    {
      opcode: "control_repeat_until",
    },
    noop,
  ],
  operator_equals: [
    {
      opcode: "operator_gt",
    },
    noop,
    {
      opcode: "operator_lt",
    },
  ],
  operator_gt: [
    noop,
    {
      opcode: "operator_equals",
    },
    {
      opcode: "operator_lt",
    },
  ],
  operator_lt: [
    {
      opcode: "operator_gt",
    },
    {
      opcode: "operator_equals",
    },
    noop,
  ],
  operator_add: [
    noop,
    {
      opcode: "operator_subtract",
    },
    {
      opcode: "operator_multiply",
    },
    {
      opcode: "operator_divide",
    },
    {
      opcode: "operator_mod",
    },
  ],
  operator_subtract: [
    {
      opcode: "operator_add",
    },
    noop,
    {
      opcode: "operator_multiply",
    },
    {
      opcode: "operator_divide",
    },
    {
      opcode: "operator_mod",
    },
  ],
  operator_multiply: [
    {
      opcode: "operator_add",
    },
    {
      opcode: "operator_subtract",
    },
    noop,
    {
      opcode: "operator_divide",
    },
    {
      opcode: "operator_mod",
    },
  ],
  operator_divide: [
    {
      opcode: "operator_add",
    },
    {
      opcode: "operator_subtract",
    },
    {
      opcode: "operator_multiply",
    },
    noop,
    {
      opcode: "operator_mod",
    },
  ],
  operator_mod: [
    {
      opcode: "operator_add",
    },
    {
      opcode: "operator_subtract",
    },
    {
      opcode: "operator_multiply",
    },
    {
      opcode: "operator_divide",
    },
    noop,
  ],
  operator_and: [
    noop,
    {
      opcode: "operator_or",
    },
  ],
  operator_or: [
    {
      opcode: "operator_and",
    },
    noop,
  ],
  sensing_mousex: [
    noop,
    {
      opcode: "sensing_mousey",
    },
  ],
  sensing_mousey: [
    {
      opcode: "sensing_mousex",
    },
    noop,
  ],
  sensing_touchingcolor: [
    noop,
    {
      opcode: "sensing_coloristouchingcolor",
      createInputs: {
        COLOR2: {
          shadowType: "colour_picker",
          value: randomColor(),
        },
      },
    },
  ],
  sensing_coloristouchingcolor: [
    {
      opcode: "sensing_touchingcolor",
      splitInputs: ["COLOR2"],
    },
    noop,
  ],
  data_setvariableto: [
    noop,
    {
      opcode: "data_changevariableby",
      remapShadowType: {
        VALUE: "math_number",
      },
    },
  ],
  data_changevariableby: [
    {
      opcode: "data_setvariableto",
      remapShadowType: {
        VALUE: "text",
      },
    },
    noop,
  ],
  data_showvariable: [
    noop,
    {
      opcode: "data_hidevariable",
    },
  ],
  data_hidevariable: [
    {
      opcode: "data_showvariable",
    },
    noop,
  ],
  data_showlist: [
    noop,
    {
      opcode: "data_hidelist",
    },
  ],
  data_hidelist: [
    {
      opcode: "data_showlist",
    },
    noop,
  ],
  data_replaceitemoflist: [
    noop,
    {
      opcode: "data_insertatlist",
    },
  ],
  data_insertatlist: [
    {
      opcode: "data_replaceitemoflist",
    },
    noop,
  ],
  data_deleteoflist: [
    noop,
    {
      opcode: "data_deletealloflist",
      splitInputs: ["INDEX"],
    },
  ],
  data_deletealloflist: [
    {
      opcode: "data_deleteoflist",
      createInputs: {
        INDEX: {
          shadowType: "math_integer",
          value: "1",
        },
      },
    },
    noop,
  ],
  pen_penDown: [
    noop,
    {
      opcode: "pen_penUp",
    },
  ],
  pen_penUp: [
    {
      opcode: "pen_penDown",
    },
    noop,
  ],
  pen_setPenColorParamTo: [
    noop,
    {
      opcode: "pen_changePenColorParamBy",
    },
  ],
  pen_changePenColorParamBy: [
    {
      opcode: "pen_setPenColorParamTo",
    },
    noop,
  ],
  pen_setPenHueToNumber: [
    noop,
    {
      opcode: "pen_changePenHueBy",
    },
  ],
  pen_changePenHueBy: [
    {
      opcode: "pen_setPenHueToNumber",
    },
    noop,
  ],
  pen_setPenShadeToNumber: [
    noop,
    {
      opcode: "pen_changePenShadeBy",
    },
  ],
  pen_changePenShadeBy: [
    {
      opcode: "pen_setPenShadeToNumber",
    },
    noop,
  ],
  pen_setPenSizeTo: [
    noop,
    {
      opcode: "pen_changePenSizeBy",
    },
  ],
  pen_changePenSizeBy: [
    {
      opcode: "pen_setPenSizeTo",
    },
    noop,
  ],
  music_setTempo: [
    noop,
    {
      opcode: "music_changeTempo",
    },
  ],
  music_changeTempo: [
    {
      opcode: "music_setTempo",
    },
    noop,
  ],
};
