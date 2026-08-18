// ARCHIVO GENERADO — NO SE EDITA A MANO.
//
// Fuente: data/reglas-lexicas.json
// Se regenera con: python scripts/generar_lexico.py
//
// Si necesitas cambiar una palabra, cámbiala en el JSON y regenera. El CI compara
// este archivo con lo que produce el generador y falla si no coinciden: es lo que
// impide que el validador de la aplicación y el de taller vuelvan a separarse
// (SDD §10).

export const LEXICO = {
  "version": "1.4.0",
  "comun": {
    "adverbitis": {
      "subcadena": [
        "adecuadamente",
        "correctamente",
        "frecuentemente",
        "suficientemente",
        "normalmente",
        "habitualmente",
        "puntualmente",
        "escasamente",
        "bastante",
        "regular"
      ],
      "palabra_completa": [
        "bien",
        "mal",
        "muy"
      ],
      "multipalabra": [
        "a veces",
        "de forma adecuada",
        "de manera correcta",
        "casi siempre",
        "en general"
      ]
    },
    "negaciones": [
      "no ",
      "carece",
      "sin lograr",
      "es incapaz",
      "nunca "
    ],
    "palabras_vacias": [
      "cada",
      "de",
      "la",
      "el",
      "los",
      "las",
      "un",
      "una",
      "que",
      "sin",
      "por",
      "no",
      "y",
      "en",
      "su",
      "se",
      "mas",
      "con",
      "al",
      "del",
      "sea"
    ],
    "modalizadores": {
      "disparadores_ayuda": [
        "de manera guiada",
        "de forma guiada",
        "con ayuda de pautas y modelos",
        "modelos dados"
      ],
      "marcas_andamiaje": [
        "guiad",
        "pauta",
        "modelo",
        "guion",
        "plantilla",
        "indicad",
        "facilitad",
        "profesor",
        "con apoyo"
      ],
      "disparadores_autonomia": [
        "progresivamente autonoma",
        "de manera autonoma",
        "de forma autonoma",
        "con autonomia"
      ],
      "marcas_andamiaje_residual": [
        "indicadas por el profesor",
        "indicados por el profesor",
        "con la pauta facilitada",
        "con la pauta dada",
        "con el modelo dado",
        "segun el guion facilitado",
        "de manera guiada"
      ]
    },
    "formulas_guiadas": [
      "de manera guiada",
      "de forma guiada",
      "sencillo",
      "con ayuda",
      "con la ayuda",
      "pautas",
      "modelos",
      "básico"
    ],
    "recuento_bandas": {
      "numerales": {
        "dos": 2,
        "tres": 3,
        "cuatro": 4,
        "cinco": 5,
        "seis": 6,
        "siete": 7,
        "ocho": 8,
        "nueve": 9,
        "diez": 10
      },
      "ninguno": [
        "sin",
        "ningun",
        "ninguna",
        "ningunos",
        "ningunas"
      ],
      "hasta": [
        "hasta",
        "como maximo"
      ],
      "rangos": [
        [
          "de",
          "a"
        ],
        [
          "entre",
          "y"
        ]
      ],
      "o_mas": [
        "o mas"
      ],
      "al_menos": [
        "al menos",
        "un minimo de"
      ],
      "mas_de": [
        "mas de"
      ],
      "alternativa": [
        "o"
      ],
      "palabras_no_contables": [
        "el",
        "la",
        "los",
        "las",
        "un",
        "una",
        "unos",
        "unas",
        "de",
        "del",
        "ese",
        "esa",
        "esos",
        "esas",
        "este",
        "esta",
        "estos",
        "estas"
      ]
    },
    "umbrales": {
      "tope_penalizacion": 0.35,
      "tope_conjunto_penalizaciones": 0.5,
      "similitud_maxima_entre_niveles": 0.75,
      "ventana_negacion_n1": 45,
      "dimensiones_sostenibles": 5,
      "minimo_dimensiones_por_combinacion": 3
    }
  },
  "por_materia": {
    "LCL": {
      "etiqueta": "Lengua Castellana y Literatura",
      "saberes_prohibidos": [
        "sintaxis",
        "morfologia",
        "ortografia",
        "puntuacion",
        "acentuacion",
        "lexico",
        "vocabulario",
        "oracion",
        "oraciones",
        "subordinadas",
        "sintagma",
        "sintagmas",
        "metrica",
        "figuras retoricas",
        "generos literarios",
        "barroco",
        "romanticismo",
        "renacimiento",
        "siglo de oro",
        "literatura medieval"
      ],
      "formulas_proceso": [
        "planificar",
        "planificacion",
        "borrador",
        "revisar",
        "revision"
      ],
      "dimensiones_con_respaldo": {
        "valoracion_canal": [
          "canal",
          "soporte"
        ],
        "propiedad_intelectual": [
          "propiedad intelectual"
        ],
        "soporte_multimodal": [
          "soporte"
        ]
      },
      "generos": [
        "expositiv",
        "argumentativ",
        "narrativ"
      ],
      "posesivos_ajenos": {
        "su atmósfera": "el relato",
        "su autoría": "la fuente citada",
        "su complejidad": "el tema expuesto",
        "su condición": "el personaje",
        "su contexto": "la obra leída",
        "su fecha": "la fuente citada",
        "su información": "la fuente citada",
        "su mayor": "la información seleccionada (en su mayor parte)",
        "su origen": "los datos citados",
        "su procedencia": "los datos o la información tomados de la fuente",
        "su propio": "cada argumento (en su propio párrafo)",
        "su propósito": "la fuente citada",
        "su párrafo": "cada argumento",
        "su respuesta": "cada objeción anticipada",
        "su situación": "el personaje",
        "sus datos": "la fuente citada",
        "sus razones": "las opiniones que se enlazan",
        "sus términos": "la objeción, expuesta con los términos en que se formula"
      },
      "sujetos_ajenos": {
        "que agrupa": "la idea general del texto, que agrupa a las demás",
        "que ajusta": "la forma deíctica elegida, que ajusta la distancia con el destinatario",
        "que delimita": "la introducción del texto expositivo",
        "que sostiene": "la idea que encabeza el resumen (antecedente elidido: «la que sostiene»)"
      }
    }
  }
};
