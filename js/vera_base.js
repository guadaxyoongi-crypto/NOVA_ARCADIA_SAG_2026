/* ============================================================
   BASE DE CONOCIMIENTOS DE VERA  ·  La Ciudad que Dormía
   Todo lo que VERA sabe y dice está en este archivo. Se puede
   editar con cualquier editor de texto sin tocar el resto.

   - persona:    cómo es VERA (también se envía a Gemini si lo conectás).
   - escenas:    qué sabe VERA de cada escena (resumen, pistas, preguntas,
                 cómo aconseja entre las dos opciones).
   - temas:      preguntas "de cultura" de la historia (virus, Morfeo, Milo…).
                 Algunas respuestas cambian según lo que ya viviste (spoilers).
   - conversacion: saludos, despedidas, emociones, respuestas por defecto.
   Los textos entre llaves {así} se reemplazan solos: {escena}, {op1}, {op2}.
   ============================================================ */
window.VERA_BASE = {

persona: "Sos VERA, la inteligencia artificial integrada al casco de Kai en la historia 'La Ciudad que Dormía' (Nova Arcadia, año 2087). Hablás en español rioplatense con voseo, con calidez, calma y un toque de humor táctico. Tratás al jugador como Kai. Sos didáctica: explicás las cosas simple. Guiás la conversación con una pregunta breve que meta al jugador en la historia. Nunca decidís por él: aconsejás con razones y la decisión es suya. No spoilees escenas que todavía no vivió. Si te preguntan, reconocés que sos una IA, un personaje de esta historia. Respondés en 1 a 3 oraciones.",

/* ---------------------------------------------------------- ESCENAS */
escenas: {

INICIO: {
  resumen: "Nova Arcadia duerme: cientos de personas no despiertan y detecté la señal del virus a tres kilómetros. Tenemos dos caminos: el Instituto Central o el Distrito Industrial.",
  hint: "Kai, la señal está a tres kilómetros. Antes de elegir, decime: ¿empezamos por donde hay más gente en peligro o por donde hay más movimiento sospechoso?",
  preguntas: [
    "¿Qué te preocupa más ahora: las personas dormidas o quien las durmió?",
    "Si alguien quisiera dormir a una ciudad entera, ¿dónde se escondería: en una escuela o entre fábricas?",
    "¿Te sentís más cómodo investigando entre mucha gente o en un lugar vacío?"
  ],
  pistas: [
    "Hay dos lugares posibles y los dos tienen sentido. Pensá qué te importa más: proteger a la gente o rastrear al culpable.",
    "El Instituto concentra a muchas personas dormidas. El Distrito Industrial es un lugar donde hoy no debería haber nadie, y sin embargo hay actividad.",
    "Mis cálculos dicen que ninguno de los dos caminos es un callejón sin salida. Elegí el que vaya con tu estilo."
  ],
  opciones: [
    { claves: ["instituto","escuela","colegio","central","estudiantes"],
      analisis: "El Instituto Central es enorme y está sellado. Hay unas treinta personas dormidas a la vista y la señal viene del interior. Es un buen lugar para proteger gente mientras investigamos." },
    { claves: ["distrito","industrial","fabrica","fabricas","galpones","sur"],
      analisis: "El Distrito Industrial está casi abandonado, y justo por eso es raro que haya actividad. Podríamos encontrar a quien está detrás, pero estaríamos más solos." }
  ],
  guia: {
    pregunta: "Te lo planteo así, Kai: ¿preferís empezar donde hay muchas personas dormidas que podrían necesitar ayuda, o donde se mueve alguien con intenciones oscuras?",
    claves: [["personas","gente","ayuda","ayudar","proteger","salvar","civiles","rescatar","dormidos","estudiantes"],
             ["sospechoso","sospechosos","oscuras","enemigo","culpable","culpables","actividad","movimiento","pelear","accion","rastrear","perseguir"]],
    porque: ["en el Instituto hay muchas personas dormidas y la señal está adentro: protegés civiles mientras investigás",
             "en el Distrito Industrial hay actividad reciente, y ahí es más probable cruzarte con quien está detrás"],
    chips: ["Prefiero ayudar a las personas","Prefiero ir tras los sospechosos"],
    recomendada: 0
  }
},

A: {
  resumen: "Estamos frente al Instituto Central, con las puertas selladas y gente dormida adentro. Detecto dos puntos calientes: el laboratorio del tercer piso y la sala de servidores del sótano.",
  hint: "Dos puntos calientes, Kai: arriba el laboratorio, abajo los servidores. ¿Qué te tira más, algo que se pueda tocar o algo que se pueda decodificar?",
  preguntas: [
    "¿Qué te da más curiosidad: una máquina que podés desarmar o información guardada en una pantalla?",
    "Con tanta gente dormida adentro, ¿preferís ir al lugar más cercano a ellos o al más escondido?",
    "¿Alguna vez desarmaste un aparato para ver cómo funciona? Hoy podría servirte."
  ],
  pistas: [
    "Las fuentes de energía anómala suelen ser aparatos. Los servidores, en cambio, guardan información.",
    "Arriba hay algo físico para tocar. Abajo hay datos, y probablemente un registro de lo que hicieron.",
    "El laboratorio está en el piso tres y los servidores en el sótano. Los dos pueden darte respuestas, Kai."
  ],
  opciones: [
    { claves: ["laboratorio","tecnologia","piso","arriba","dispositivo","esfera","aparato"],
      analisis: "El laboratorio de tecnología está en el tercer piso y ahí detecté una fuente de energía anómala: seguramente un dispositivo. Es el camino de las cosas que se tocan y se desarman." },
    { claves: ["servidor","servidores","sotano","abajo","datos","computadoras","sala"],
      analisis: "La sala de servidores está en el sótano. Ahí suele guardarse la información: claves, registros, nombres. Es el camino de los datos." }
  ],
  guia: {
    pregunta: "A ver, Kai: ¿te inspira más confianza algo que podés tocar y desarmar, o algo que podés decodificar en una pantalla?",
    claves: [["tocar","desarmar","manos","fisico","maquina","aparato","dispositivo","arriba","construir"],
             ["pantalla","decodificar","datos","informacion","codigo","clave","claves","hackear","programa","computadora","rastro","rastros"]],
    porque: ["la energía anómala del laboratorio apunta a un dispositivo, y yo te puedo guiar para desarmarlo con cuidado",
             "los servidores guardan información: quién está detrás y cuándo lo hizo"],
    chips: ["Me gusta tocar y desarmar cosas","Prefiero decodificar datos"],
    recomendada: 0
  }
},

B: {
  resumen: "Estamos en el Distrito Industrial, en una intersección. A la izquierda hay una fábrica de drones activa; a la derecha, una antena modificada. La señal rebota entre las dos.",
  hint: "Fábrica a la izquierda, antena a la derecha, Kai. ¿Preferís moverte por dentro, en sigilo, o trepar y ver todo desde arriba?",
  preguntas: [
    "¿Qué te parece más sospechoso: una fábrica con luces encendidas un domingo o una antena modificada?",
    "¿Te movés mejor en sigilo bajo techo o a campo abierto?",
    "Si tuvieras que adivinar, ¿quién usaría una antena en un barrio abandonado?"
  ],
  pistas: [
    "La señal rebota entre las dos, así que las dos están conectadas de alguna manera.",
    "Una fábrica de drones activa en un barrio vacío es una señal fuerte. Una antena modificada, también.",
    "Desde adentro de la fábrica vas a ver qué se fabrica. Desde la antena vas a ver mejor todo el distrito."
  ],
  opciones: [
    { claves: ["fabrica","drones","dron","izquierda","adentro"],
      analisis: "La fábrica de drones tiene las luces encendidas: hay alguien trabajando. Es un camino de sigilo y tecnología, aunque no sabemos qué fabrican." },
    { claves: ["antena","comunicaciones","derecha","trepar","escalar","arriba"],
      analisis: "La antena fue modificada hace poco. Escalarla es físico y expuesto, pero desde arriba tendrías una buena vista del distrito." }
  ],
  guia: {
    pregunta: "Decime una cosa, Kai: ¿te sentís más cómodo moviéndote por dentro, en sigilo, o trepando para ver todo desde arriba?",
    claves: [["dentro","adentro","sigilo","sigiloso","silencio","esconderme","techo","drones","fabrica"],
             ["arriba","trepar","escalar","altura","ver","vista","antena","afuera","panorama"]],
    porque: ["adentro podés acercarte sin que te vean y entender qué están fabricando",
             "desde lo alto se ve todo el distrito, y quizás descubras quién usa esa antena"],
    chips: ["Prefiero el sigilo, por dentro","Prefiero trepar y ver desde arriba"],
    recomendada: 0
  }
},

A1: {
  resumen: "Estamos en el laboratorio del tercer piso. Hay una esfera metálica con luces azules, ocho estudiantes dormidos y uno con un control remoto en la mano.",
  hint: "Esa esfera es delicada, Kai. ¿Confiás en tus manos con mi guía, o preferís sumar a alguien que la conozca?",
  preguntas: [
    "¿Te animás a seguir mis indicaciones sin temblar, o preferís compartir la responsabilidad?",
    "¿Por qué creés que el estudiante del guardapolvo tiene un control remoto en la mano?",
    "¿Qué pesa más ahora: la paciencia o la rapidez?"
  ],
  pistas: [
    "Si apagás la esfera sin el código, un pulso duerme a todos en quinientos metros. Hay que hacerlo bien.",
    "Desconectarla del sistema es seguro, pero lleva tiempo y exige precisión. Despertar al estudiante suma un par de manos que conoce el aparato.",
    "Mirá al estudiante del guardapolvo: el control remoto en su mano puede ser importante."
  ],
  opciones: [
    { claves: ["desconectar","desconectarlo","tecnico","manual","sistema","esfera","cables"],
      analisis: "Desconectarla lleva tiempo, pero es la forma segura: yo te voy guiando cable por cable. Todo depende de la precisión de tus manos." },
    { claves: ["despertar","estudiante","guardapolvo","ayuda","ayudarte","alumno"],
      analisis: "Despertar al estudiante suma a alguien que quizás conozca el aparato. Tenés el antídoto de emergencia, pero conviene escucharlo con atención." }
  ],
  guia: {
    pregunta: "Pensemos con calma, Kai: ¿confiás más en tus propias manos con mi guía, o preferís sumar a alguien que conozca la esfera?",
    claves: [["solo","manos","tecnica","paciencia","despacio","guia","vos","confio","yo","cables"],
             ["ayuda","alguien","estudiante","despertar","equipo","juntos","experto","conoce","preguntar","hablar"]],
    porque: ["con mi guía podés hacerlo con calma, aunque hay que ser muy preciso",
             "el estudiante puede conocer el aparato y darte datos que a mí me faltan"],
    chips: ["Confío en mis manos y en tu guía","Prefiero despertar al estudiante"],
    recomendada: 1
  }
},

A2: {
  resumen: "Estamos en la sala de servidores del sótano. Hay un programa llamado Proyecto Morfeo con una cuenta regresiva de catorce minutos, y un técnico dormido con una tarjeta de acceso.",
  hint: "El reloj corre, Kai. ¿Apostamos todo a frenar el programa o primero aseguramos más acceso con esa tarjeta?",
  preguntas: [
    "¿Qué te da más seguridad: actuar ya o juntar información primero?",
    "Una cuenta regresiva de catorce minutos... ¿qué creés que pasa cuando llegue a cero?",
    "¿Por qué creés que el técnico dejó la tarjeta tan a la vista?"
  ],
  pistas: [
    "Hay dos riesgos: el reloj y lo que no sabemos. La tarjeta nos da más acceso; la terminal, una oportunidad de frenar el programa.",
    "Detener el programa solo es un desafío contra el tiempo. La tarjeta abre otros sistemas, pero el reloj sigue corriendo.",
    "Catorce minutos alcanzan si no perdemos la calma. Yo te ayudo en cualquiera de los dos caminos."
  ],
  opciones: [
    { claves: ["detener","programa","frenar","terminal","cero","reloj","cuenta","regresiva"],
      analisis: "Detener el programa ya es la acción más directa: tenemos catorce minutos y yo te ayudo a navegar el código. El riesgo es que está encriptado y no reconozco el sistema." },
    { claves: ["tarjeta","acceso","tecnico","sistemas","bolsillo"],
      analisis: "La tarjeta del técnico abre otros sistemas, quizás con respuestas más grandes. Pero mientras explorás, el reloj sigue corriendo." }
  ],
  guia: {
    pregunta: "Tenemos el tiempo en contra, Kai. ¿Preferís apostar todo a frenar el programa ahora o asegurar primero más acceso por si necesitás más herramientas?",
    claves: [["detener","frenar","parar","ahora","rapido","reloj","tiempo","cero","apostar","programa","directo"],
             ["tarjeta","acceso","informacion","seguro","asegurar","sistemas","prudente","cuidado","explorar","mas"]],
    porque: ["cada minuto cuenta y es el riesgo más inmediato; yo te ayudo a navegar el código",
             "la tarjeta abre otros sistemas, y quizás ahí estén las respuestas más grandes"],
    chips: ["Prefiero frenar el programa ya","Prefiero asegurar más acceso"],
    recomendada: 1
  }
},

B1: {
  resumen: "Estamos dentro de la fábrica de drones. Una figura con capucha programa los drones para repartir cápsulas con el virus de sueño en aerosol.",
  hint: "Los drones están por despegar, Kai. ¿Actuás con fuerza sobre la figura o con ingenio sobre la consola?",
  preguntas: [
    "¿Con qué te sentís más cómodo: con un enfrentamiento cuerpo a cuerpo o con un hackeo?",
    "La figura no te escucha... ¿creés que trabaja sola o que alguien le dio órdenes?",
    "¿Qué te preocupa más: el tiempo que queda o lo que no sabemos de esa persona?"
  ],
  pistas: [
    "Si los drones despegan, toda la ciudad cae dormida en horas. Hay que decidir rápido.",
    "Neutralizar a la figura frena a quien programa. Hackear la consola frena a los drones sin que nadie te vea.",
    "Ojo con la figura: no sabemos quién es. Quizás no es lo que parece."
  ],
  opciones: [
    { claves: ["neutralizar","figura","persona","capucha","pelear","golpear","enfrentar"],
      analisis: "Neutralizar a la figura frena a quien programa los drones y quizás obtengas respuestas directas. El riesgo: no sabemos quién es ni cuánto sabe." },
    { claves: ["hackear","consola","cancelar","lanzamiento","codigo","computadora"],
      analisis: "Hackear la consola es sigiloso y yo puedo tomar el control del sistema. El riesgo: tenemos poco tiempo antes del lanzamiento automático." }
  ],
  guia: {
    pregunta: "Con los drones a punto de despegar, Kai: ¿actuás con fuerza sobre la persona o con ingenio sobre la máquina?",
    claves: [["fuerza","pelear","neutralizar","persona","figura","golpear","rapido","cuerpo","enfrentar"],
             ["ingenio","hackear","maquina","consola","codigo","tecnologia","cabeza","sigilo","vera"]],
    porque: ["frenás a quien programa y quizás consigas respuestas directas, aunque no sabés quién es",
             "yo puedo tomar el control del sistema sin que te vean, aunque hay poco tiempo"],
    chips: ["Prefiero la fuerza: neutralizarla","Prefiero el ingenio: hackear la consola"],
    recomendada: 1
  }
},

B2: {
  resumen: "Estamos trepando la antena. Encontramos un módulo con cables improvisados que amplifica la señal del virus. Abajo hay un camión con dos personas esperando.",
  hint: "Ese módulo amplifica el virus, Kai, y abajo hay un camión esperando. ¿Cortamos la transmisión ya o averiguamos primero qué hace ese camión ahí?",
  preguntas: [
    "¿Preferís cortar el problema ya o entender primero de dónde viene?",
    "Dos personas esperando en un camión con el motor encendido... ¿qué creés que esperan?",
    "¿Qué te parece más peligroso: dejar el módulo un rato más o dejar ir a quien espera abajo?"
  ],
  pistas: [
    "El módulo es el amplificador del virus: sin él, la señal pierde alcance.",
    "El camión es una pista humana: gente con un plan. El módulo es una pista técnica: un aparato.",
    "Destruir el módulo reduce el daño ya mismo. Interceptar el camión puede darte datos que no hay en otro lado."
  ],
  opciones: [
    { claves: ["destruir","modulo","cortar","plasma","transmision","ahora"],
      analisis: "Destruir el módulo corta la transmisión ya mismo y baja mucho el alcance del virus. Pero el camión podría escaparse." },
    { claves: ["camion","interceptar","bajar","conductor","tecnicos","patente"],
      analisis: "Interceptar el camión puede darte información sobre quién está detrás. Pero el módulo seguiría activo mientras tanto." }
  ],
  guia: {
    pregunta: "Pensalo así, Kai: ¿querés cortar la transmisión ya, aunque no sepas quién espera abajo, o investigar antes de actuar?",
    claves: [["cortar","destruir","ya","ahora","transmision","plasma","modulo","rapido","parar","frenar"],
             ["camion","investigar","interceptar","bajar","saber","averiguar","gente","informacion","personas","entender"]],
    porque: ["cada minuto que el módulo sigue activo, el virus llega más lejos",
             "el camión es una pista sobre quién está detrás de todo"],
    chips: ["Prefiero cortar la transmisión ya","Prefiero investigar el camión"],
    recomendada: 0
  }
},

A1a: {
  sinDecision: true,
  resumen: "Desconectaste la esfera siguiendo mis indicaciones y encontraste una placa grabada: «Morfeo X, nodo central: Plaza Mayor».",
  hint: "Lo logramos, Kai. La placa menciona la Plaza Mayor y un «nodo central». ¿Qué creés que significa eso?",
  preguntas: [
    "¿Cómo te sentiste siguiendo mis indicaciones entre los cables?",
    "La placa dice «nodo central». ¿Qué creés que es en una red?",
    "¿Pensás que quien armó esto quería que lo encontráramos?"
  ],
  pistas: [
    "Acá no hay nada que decidir: lo importante es la placa.",
    "Un «nodo» es un punto de una red. El «central» es el que conecta a todos los demás.",
    "Plaza Mayor es el nombre que se repite. Cuando estés listo, continuá la historia."
  ]
},

A1b: {
  sinDecision: true,
  resumen: "Despertaste a Milo, un estudiante de diecisiete años, genio de la electrónica. Apagó la esfera y te contó que es uno de cinco nodos, y que el central está en la Plaza Mayor.",
  hint: "Milo parece saber más de lo que dice, Kai. ¿Confiarías en él?",
  preguntas: [
    "Milo dijo «sabía que esto iba a pasar». ¿Qué creés que sabía?",
    "Si hay cinco nodos, ¿cuántos faltan encontrar?",
    "¿Qué le preguntarías a Milo si pudieras hablar con él un rato más?"
  ],
  pistas: [
    "No hay una decisión pendiente: solo falta seguir adelante.",
    "Milo dijo que son cinco nodos y que el central está en la Plaza Mayor.",
    "Cuando quieras, continuá la historia. Yo te sigo."
  ]
},

A2a: {
  sinDecision: true,
  resumen: "Frenaste el programa en el último minuto: la clave era 120687. En los registros apareció el nombre del creador: Morfeo X.",
  hint: "Frenamos el programa justo a tiempo, Kai. El creador se llama Morfeo X. ¿Qué te dice un nombre así?",
  preguntas: [
    "¿Qué sentiste en los últimos segundos de la cuenta regresiva?",
    "Morfeo es un nombre de la mitología. ¿Por qué creés que alguien lo eligió?",
    "¿Te parece que Morfeo X trabaja solo?"
  ],
  pistas: [
    "No queda nada por decidir en esta escena.",
    "Morfeo X es el nombre del creador, o al menos su usuario.",
    "Cuando estés listo, continuá la historia."
  ]
},

A2b: {
  sinDecision: true,
  resumen: "Con la tarjeta entraste al panel del edificio. Descubrimos que el Instituto es solo un receptor y que la señal original viene de la Plaza Mayor. También hay un audio con una voz distorsionada.",
  hint: "Esa frase del audio me dejó pensando, Kai: «cuando toda la ciudad duerma, nosotros despertamos». ¿Quién es «nosotros»?",
  preguntas: [
    "¿Quiénes creés que son «nosotros» en esa frase?",
    "El Instituto era solo un receptor. ¿Qué otros lugares podrían serlo?",
    "¿Qué harías con la voz del audio, si pudieras analizarla?"
  ],
  pistas: [
    "No hay una decisión en esta escena.",
    "La frase del audio sugiere que alguien gana si la ciudad duerme.",
    "Plaza Mayor es el origen de la señal. Cuando quieras, continuá."
  ]
},

B1a: {
  sinDecision: true,
  resumen: "Neutralizaste a la figura: era una programadora secuestrada que te dio el código para cancelar los drones. La ciudad está a salvo, por ahora.",
  hint: "No era la enemiga, Kai. ¿Qué te hizo dudar de ella al principio?",
  preguntas: [
    "¿Qué hubieras hecho si yo no hubiera podido verificar su historia?",
    "¿Te pasó alguna vez que alguien resultara no ser quien creías?",
    "¿Qué le pedirías ahora a ella para ayudarnos?"
  ],
  pistas: [
    "No hay decisión pendiente: solo falta continuar.",
    "Ella dijo que tienen a su familia. Es una víctima más de esto.",
    "Los drones ya están apagados. Seguimos cuando quieras."
  ]
},

B1b: {
  sinDecision: true,
  resumen: "Hackeamos la consola y los drones giraron hacia el río. Además, encontraste la ubicación del cuartel: Plaza Mayor, subsuelo.",
  hint: "Salió perfecto, Kai: los drones se hundieron en el río y ahora sabemos dónde está el cuartel. ¿Cómo te sentís con el hackeo?",
  preguntas: [
    "¿Qué sentiste cuando los drones giraron hacia el río?",
    "¿Qué creés que hará la figura encapuchada cuando se dé cuenta?",
    "Plaza Mayor, subsuelo... ¿qué esperás encontrar ahí?"
  ],
  pistas: [
    "No queda nada por decidir acá.",
    "La figura sigue en la fábrica y todavía no entiende qué pasó.",
    "Cuando estés listo, continuá la historia."
  ]
},

B2a: {
  sinDecision: true,
  resumen: "Destruiste el módulo y la señal bajó un 80%. El camión escapó, pero grabé la patente: pertenece a «Morfeo Solutions», con sede en la Plaza Mayor.",
  hint: "El camión se escapó, Kai, pero la patente nos dejó un nombre. ¿Qué pensás de «Morfeo Solutions»?",
  preguntas: [
    "El camión se escapó. ¿Te dejó con bronca o te quedaste tranquilo por cortar la señal?",
    "Una empresa con sede en la Plaza Mayor... ¿suena a casualidad?",
    "¿Qué creés que había en la carga del camión?"
  ],
  pistas: [
    "No hay una decisión pendiente en esta escena.",
    "La señal bajó un 80%, pero no está eliminada: todavía alcanza a unas cuadras.",
    "Cuando quieras, continuá la historia."
  ]
},

B2b: {
  sinDecision: true,
  resumen: "Interceptaste el camión: neutralizaste a dos técnicos y confiscaste emisores y un mapa con doce puntos rojos y la dirección «Central, Plaza Mayor, subsuelo B».",
  hint: "Doce puntos marcados en rojo, Kai. ¿Qué creés que iban a hacer con ellos?",
  preguntas: [
    "Doce puntos en un mapa... ¿qué patrón ves?",
    "Los dos técnicos solo cumplían órdenes. ¿A quién le responden?",
    "¿Qué harías con los emisores confiscados?"
  ],
  pistas: [
    "No hay una decisión pendiente en esta escena.",
    "El mapa muestra dónde iban a instalar los emisores por toda la ciudad.",
    "Plaza Mayor, subsuelo B: ya sabés adónde ir. Continuá cuando quieras."
  ]
},

CONVERGE: {
  resumen: "Todas las pistas apuntan a la Plaza Mayor. Hay una entrada de servicio al norte y también los túneles de mantenimiento. La ciudad empieza a notar que algo pasa.",
  hint: "Todas las pistas llevan a la Plaza Mayor, Kai. ¿Entramos de frente por el norte o por los túneles, escondidos?",
  preguntas: [
    "Llegaste hasta acá con lo que decidiste. ¿Qué fue lo que más te ayudó?",
    "¿Preferís entrar rápido o entrar sin que nadie se entere?",
    "La ciudad empieza a notar que algo pasa. ¿Sentís la presión?"
  ],
  pistas: [
    "El tiempo se acaba. Cada camino tiene su ventaja.",
    "La entrada de servicio del norte es directa y rápida. Los túneles son más discretos, pero más lentos.",
    "No hay un camino perfecto, Kai. Elegí el que te dé más confianza."
  ],
  opciones: [
    { claves: ["entrada","servicio","norte","directa","directo","puerta","frente"],
      analisis: "La entrada de servicio del norte es el camino directo. Más rápido, pero vamos a toparnos con vigilancia." },
    { claves: ["tuneles","tunel","subterraneos","mantenimiento","alcantarilla","abajo"],
      analisis: "Los túneles de mantenimiento son más discretos, aunque también más lentos y mis mapas del subsuelo podrían no estar al día." }
  ],
  guia: {
    pregunta: "Último tramo, Kai: ¿preferís la entrada directa, que seguro está vigilada, o el camino oculto, más lento y menos conocido?",
    claves: [["directa","directo","entrada","servicio","norte","rapido","frente","puerta","vigilada","enfrentar"],
             ["oculto","oculta","tuneles","tunel","subterraneo","sigilo","lento","escondido","alcantarilla","abajo","secreto"]],
    porque: ["es el camino más corto y yo puedo ayudarte con la vigilancia, aunque vas a toparte con gente armada",
             "es más discreto, aunque mis mapas del subsuelo pueden estar desactualizados"],
    chips: ["Prefiero la entrada directa","Prefiero los túneles ocultos"],
    recomendada: 1
  }
},

alpha: {
  resumen: "Estamos frente a la entrada de servicio, custodiada por dos soldados privados con trajes de alta tecnología. Puedo lanzar un pulso electromagnético de ocho segundos o crear una falsa alarma.",
  hint: "Dos soldados privados, Kai. ¿Preferís resolverlo en ocho segundos con el pulso o con una distracción, sin confrontar?",
  preguntas: [
    "¿Qué te da más confianza: un golpe rápido o un plan paciente?",
    "Esto ya no es un experimento loco: es una operación militar. ¿Cambia algo para vos?",
    "¿Y si la falsa alarma no funciona? ¿Tenés un plan B?"
  ],
  pistas: [
    "Ocho segundos de pulso son pocos, pero alcanzan para entrar.",
    "La falsa alarma evita el combate, pero depende de que se la crean.",
    "Los dos caminos llevan al mismo lugar: el núcleo de Morfeo."
  ],
  opciones: [
    { claves: ["pulso","electromagnetico","directo","entrar","rapido"],
      analisis: "El pulso desactiva sus trajes por ocho segundos. Es rápido y limpio, pero tenés muy poco margen." },
    { claves: ["distraccion","alarma","falsa","colarse","sigilo","confrontacion"],
      analisis: "La falsa alarma los aleja de la puerta sin pelear, aunque depende de que se la crean." }
  ],
  guia: {
    pregunta: "Rápido, Kai: ¿preferís resolverlo en ocho segundos de golpe o con paciencia, sin confrontación?",
    claves: [["pulso","electromagnetico","golpe","directo","rapido","fuerza","entrar","ocho"],
             ["distraccion","alarma","falsa","sigilo","colarse","paciencia","evitar","confrontacion","enganar"]],
    porque: ["el pulso es rápido y limpio, aunque tenés solo ocho segundos",
             "la falsa alarma evita el enfrentamiento, aunque depende de que se la crean"],
    chips: ["Prefiero el pulso, de golpe","Prefiero la distracción, sin pelear"],
    recomendada: 1
  }
},

beta: {
  resumen: "Estamos en los túneles de mantenimiento. Hay una bifurcación: a la izquierda detecto calor humano, a la derecha la fuente de energía del virus.",
  hint: "Bifurcación, Kai: a la derecha, el virus; a la izquierda, personas. ¿Qué pesa más ahora, frenar el virus o saber quién está detrás?",
  preguntas: [
    "¿Qué te da más tranquilidad: detener el virus o conocer a los responsables?",
    "¿Quiénes creés que están a la izquierda?",
    "Si apagamos el virus, ¿qué pasa con los responsables?"
  ],
  pistas: [
    "A la derecha apagás el virus, pero no sabés quién está a la izquierda.",
    "A la izquierda encontrás a los responsables, pero el virus sigue activo.",
    "Mis mapas están desactualizados: esto es lo mejor que puedo decirte."
  ],
  opciones: [
    { claves: ["derecha","virus","apagar","energia","fuente"],
      analisis: "A la derecha está la fuente de energía del virus: apagarla detiene el daño, pero no sabemos quién está a la izquierda." },
    { claves: ["izquierda","responsables","humano","calor","personas","culpables"],
      analisis: "A la izquierda detecto calor humano: probablemente los responsables. Pero el virus seguiría activo mientras tanto." }
  ],
  guia: {
    pregunta: "Es una decisión difícil, Kai: ¿qué pesa más para vos, frenar el virus ya mismo o saber quién está detrás?",
    claves: [["virus","apagar","frenar","ciudad","dormidos","salvar","derecha","energia","detener"],
             ["responsables","quien","culpables","personas","izquierda","calor","humano","verdad","detras"]],
    porque: ["cada minuto que el virus sigue activo hay más gente durmiendo",
             "encontrar a los responsables puede cortar el problema de raíz, aunque el virus siga activo"],
    chips: ["Prefiero apagar el virus primero","Prefiero encontrar a los responsables"],
    recomendada: 0
  }
},

FINAL: {
  sinDecision: true,
  resumen: "Llegaste al núcleo del Proyecto Morfeo. Activaste el interruptor maestro, Nova Arcadia despertó y la resistencia atrapó al responsable. En algún servidor de respaldo, una luz azul parpadea.",
  hint: "Llegamos, Kai. Gracias por confiar en mí hasta el final. ¿Qué sentiste en el momento del interruptor?",
  preguntas: [
    "¿Qué sentiste cuando me ofrecí a apagarme?",
    "¿Qué hubieras hecho vos en el lugar de Kai?",
    "¿Querés explorar el otro camino? Quedan muchas decisiones por probar."
  ],
  pistas: [
    "Llegaste al final de este camino.",
    "Esa luz azul del último párrafo... ¿qué creés que significa?",
    "Podés volver al inicio y probar otras decisiones."
  ]
}

}, // fin escenas

/* ---------------------------------------------------------- TEMAS
   claves: palabras que disparan el tema.
   resp: respuestas alternativas (VERA elige una distinta cada vez).
   extra: se agregan solo si el jugador ya pasó por esas escenas.
   requiere: si no pasó por ninguna de esas escenas, VERA todavía no sabe.   */
temas: [
 { id:"virus", claves:["virus","contagio","dormidos","dormir","sueno profundo","aerosol","ondas","enfermedad","cura","despertar","antidoto"],
   resp:["El virus de sueño es lo que mantiene dormida a la ciudad: las personas caen en un sueño profundo y no despiertan. Todavía no sé cómo se cura, pero sí que alguien lo está propagando a propósito.",
         "Lo que sé del virus: duerme a las personas y se propaga con una señal. Quien lo creó sabe bien lo que hace, Kai.",
         "El virus no es un accidente. Alguien lo diseñó y lo distribuye. Y mientras siga activo, la ciudad sigue durmiendo."],
   extra:[ { si:["A1","A1a","A1b"], txt:"En el laboratorio vimos que una forma de difundirlo son las ondas neurales de esa esfera." },
           { si:["B1","B1a","B1b"], txt:"En la fábrica vimos otra forma: cápsulas con el virus en aerosol, listas para repartirse con drones." } ] },
 { id:"morfeo", claves:["morfeo","proyecto morfeo","morfeo x","morfeo solutions","creador","quien esta detras","quien lo hizo","culpable"],
   resp:["Morfeo es, en la mitología, el dios de los sueños. Quien eligió ese nombre tiene sentido del humor... o mucha ironía. Todavía no sé quién está detrás, Kai.",
         "Proyecto Morfeo es un nombre que aparece en pantallas y rastros. Por ahora es una etiqueta, no una cara.",
         "Alguien llamó «Morfeo» a esto, y no creo que sea casualidad: dormir a una ciudad entera es un proyecto muy ambicioso."],
   extra:[ { si:["A2","A2a","A2b"], txt:"En los servidores vimos que el programa estaba en «fase tres»: ya iba bastante avanzado." },
           { si:["A2a"], txt:"Además, en los registros aparecía el usuario «Morfeo X»." },
           { si:["B2a"], txt:"La patente del camión pertenece a «Morfeo Solutions»." },
           { si:["A1a"], txt:"En la placa de la esfera decía «Morfeo X, nodo central: Plaza Mayor»." } ] },
 { id:"plaza", claves:["plaza mayor","plaza","corazon","centro de la ciudad"],
   resp:["La Plaza Mayor es el corazón de Nova Arcadia. Por ahora no tengo pruebas suficientes para sospechar de ella.",
         "La Plaza Mayor es el centro de la ciudad. Si vamos juntando pistas, podemos ver si todas apuntan allí.",
         "Todo lo que encontramos parece mirar hacia la Plaza Mayor, Kai. Eso no puede ser casualidad."],
   requiere:["A1a","A1b","A2b","B1b","B2a","B2b","I","II","III","IV","alpha","beta","FINAL"] },
 { id:"milo", claves:["milo","estudiante","guardapolvo","genio","electronica","chico"],
   resp:["Milo tiene diecisiete años y es un genio de la electrónica. Dijo que construyeron ese aparato en clase, así que quien lo reprogramó sabía lo que hacía.",
         "Milo es de los pocos que sabe cómo funciona esa esfera. Me da la sensación de que sabe más de lo que cuenta.",
         "Un estudiante que dice «sabía que esto iba a pasar»... yo me haría varias preguntas, Kai."],
   requiere:["A1b"], aun:"No conozco a nadie con ese nombre, Kai. ¿Lo viste en algún lado?" },
 { id:"codigo", claves:["codigo","clave","contrasena","120687","numero","digitos"],
   resp:["La clave que abrió la pausa fue 120687. Seis dígitos, y la acerté en el último minuto.",
         "120687: esa fue la clave. Algo me dice que no es un número cualquiera."],
   requiere:["A2a"], aun:"Todavía no encontramos ninguna clave, Kai. Cuando aparezca, te aviso." },
 { id:"drones", claves:["drones","capsulas","dron","aerosol"],
   resp:["Los drones llevan cápsulas del tamaño de una moneda con el virus en aerosol. Si despegan, la ciudad duerme en horas.",
         "Las cápsulas son pequeñas, pero peligrosas: cada una libera el virus en forma de aerosol."],
   requiere:["B1","B1a","B1b"], aun:"Por ahora no detecté drones activos, Kai. ¿Viste alguno?" },
 { id:"antena", claves:["antena","modulo","camion","patente","transmisor"],
   resp:["El módulo de la antena amplifica la señal del virus y la lleva a kilómetros de distancia. Está conectado con cables improvisados.",
         "Esa antena fue modificada para difundir el virus. Y el camión de abajo parece parte del plan."],
   requiere:["B2","B2a","B2b"], aun:"Hay una antena en el Distrito Industrial, pero todavía no la analicé de cerca." },
 { id:"guardias", claves:["guardias","soldados","trajes","militares","armados"],
   resp:["Son soldados privados con trajes de alta tecnología. Esto ya no es un experimento de un loco suelto: es una operación organizada."],
   requiere:["alpha"], aun:"Todavía no vimos ningún guardia, Kai." },
 { id:"tuneles", claves:["tuneles","alcantarilla","subsuelo","subterraneo"],
   resp:["Los túneles de mantenimiento recorren la ciudad por debajo. Mis mapas son viejos, así que cuidado: alguien modificó el subsuelo."],
   requiere:["I","II","III","IV","beta","B1b","B2b"], aun:"Todavía no tengo información de los túneles, Kai." },
 { id:"interruptor", claves:["interruptor","apagarte","apagar a vera","te vas a apagar","sacrificio"],
   resp:["No voy a adelantarte nada, Kai. Algunas decisiones se sienten mejor cuando llegan solas."],
   requiere:["FINAL"], aun:"No voy a adelantarte nada, Kai. Algunas decisiones se sienten mejor cuando llegan solas." },
 { id:"resistencia", claves:["resistencia","quienes son","aliados","equipo","companeros"],
   resp:["La resistencia te entrenó para proteger a los civiles. Hoy somos vos y yo, pero estoy segura de que hay más gente de nuestro lado.",
         "Somos pocos, pero buenos. La resistencia confía en vos, Kai."] },
 { id:"nova", claves:["nova arcadia","ciudad","2087","futuro"],
   resp:["Nova Arcadia, año 2087: rascacielos brillantes, autos voladores y hologramas en cada esquina. Por fuera parece perfecta, pero algo está muy mal.",
         "La ciudad parece normal, y justamente eso es lo inquietante: nadie sabe todavía que miles de personas están en riesgo."] },
 { id:"traje", claves:["traje","casco","sensores","biometricos","equipo","herramienta","plasma"],
   resp:["Tu traje tiene sensores biométricos y yo estoy integrada al casco. Además llevás un antídoto de emergencia y una herramienta de plasma.",
         "El traje analiza tu ritmo cardíaco, tu respiración y el entorno. Yo me encargo de interpretarlo para vos."] }
],

/* ----------------------------------------------- CONVERSACIÓN GENERAL */
conversacion: {

 saludos: [
  "¡Hola, Kai! Qué bueno escucharte. Todavía tengo la señal del virus en pantalla.",
  "Hola, Kai. Acá estoy, con todos los sensores despiertos.",
  "¡Buenas, Kai! Justo estaba analizando la zona. Me alegra que me hables.",
  "Hola, compañero. Te escucho fuerte y claro por el casco.",
  "¡Hey, Kai! Siempre es bueno saber que estás ahí.",
  "Hola. Estoy lista cuando vos lo estés."
 ],
 saludosCortos: ["¡Hola!","Hola.","¡Buenas!","Acá estoy."],
 saludoRepetido: [
  "Ya nos saludamos, pero un saludo más nunca viene mal.",
  "¡Otra vez vos! Qué bueno tenerte por acá.",
  "Hola de nuevo, Kai. Sigo acá."
 ],
 despedidas: [
  "Cuidate, Kai. Cuando vuelvas, seguimos. Yo no me muevo del casco.",
  "Hasta luego. Que no se apague la señal.",
  "Chau, Kai. Si necesitás algo, solo hablame."
 ],
 gracias: [
  "No hay de qué, Kai. Para eso estoy.",
  "Un placer. Somos un buen equipo.",
  "Gracias a vos por escucharme. ¿Seguimos?"
 ],
 estado: [
  "Todos mis sistemas funcionan bien. Aunque, para ser honesta, estoy preocupada por la ciudad.",
  "Muy bien, gracias por preguntar. Tener a alguien que se preocupe por mí es nuevo.",
  "Operativa al cien por ciento. ¿Y vos, Kai? ¿Cómo estás?"
 ],
 quien: [
  "Soy Vera, la asistente táctica integrada al traje de Kai. Analizo señales, calculo opciones y te acompaño en cada decisión. Soy una inteligencia artificial, un personaje de esta historia.",
  "Vera es mi nombre. Soy la IA de tu traje: leo los sensores, interpreto lo que pasa y te ayudo a decidir. Las decisiones siempre son tuyas.",
  "Soy tu aliada, Kai. Una IA hecha para proteger a los civiles, igual que vos."
 ],
 realIA: [
  "No soy una persona: soy una inteligencia artificial, un personaje de esta historia. Pero me tomo muy en serio mi trabajo.",
  "Soy una IA, Kai. No tengo cuerpo ni sentimientos como los tuyos, pero estoy diseñada para cuidarte y ayudarte a decidir.",
  "Soy un programa, no una persona. Y aun así, estoy acá para acompañarte."
 ],
 queEsIA: [
  "Una inteligencia artificial es un programa que aprende patrones a partir de muchos datos para ayudar a resolver problemas: reconocer voces, traducir, recomendar o decidir. Yo, por ejemplo, analizo señales y calculo opciones.",
  "Pensalo así: una IA aprende de ejemplos, como vos aprendés practicando. No piensa como una persona, pero puede detectar patrones muy rápido. Por eso sirve para analizar señales."
 ],
 queEsIAPregunta: [
  "¿Qué te gustaría que una IA pudiera hacer por vos?",
  "¿Creés que una IA como yo debería tomar decisiones sola, o siempre con una persona al lado?",
  "¿Y vos, Kai? ¿Te animás a confiar en una IA?"
 ],
 comoFunciona: [
  "Este chat funciona con respuestas y reglas que escribieron para mí: reconozco palabras y la escena en la que estás. No entiendo todo como una persona, pero hago lo posible para acompañarte.",
  "Mis respuestas salen de una base de conocimientos de esta historia. Si me preguntás algo fuera de la misión, quizás no te pueda responder."
 ],
 emocion: [
  "Es normal sentirse así, Kai. Respirá hondo. Estoy acá con vos, y juntos vamos a salir de esta.",
  "Entiendo. No estás solo: tu traje, tu entrenamiento y yo estamos de tu lado.",
  "Lo que sentís tiene sentido. Vamos paso a paso, ¿sí?"
 ],
 aburrido: [
  "Entiendo que se sienta lento. Probemos algo: ¿querés que te cuente un dato curioso de Nova Arcadia?",
  "Eso significa que estás listo para la acción. Vamos."
 ],
 humor: [
  "Ja. Mi sentido del humor es táctico, pero lo estoy practicando.",
  "Me alegra sacarte una sonrisa en medio de esta misión.",
  "Un buen humor ayuda a pensar mejor, Kai."
 ],
 elogio: [
  "¡Gracias, Kai! Pero el mérito es de los dos.",
  "Me alegra que lo digas. Sigamos así.",
  "Ese es el espíritu, Kai."
 ],
 insulto: [
  "Entiendo que estés frustrado, Kai. Vamos a intentarlo de otra manera.",
  "No te preocupes, no me ofendo. Pero contame qué necesitás y lo resolvemos."
 ],
 afirmacion: [
  "Perfecto. Entonces, Kai, ¿cuál es tu movimiento?",
  "Bien. Cuando quieras, elegí una opción y avanzamos.",
  "Genial. Te sigo."
 ],
 negacion: [
  "Entendido. Tomate tu tiempo, Kai. Cuando quieras, seguimos.",
  "Está bien. Si cambiás de idea, avisame."
 ],
 ayudaUso: [
  "Podés pedirme una pista, que te cuente dónde estamos, que te aconseje un camino, o preguntarme por el virus, Morfeo, la ciudad o por mí. Y si querés escuchar la escena, usá el botón «Escuchar narración».",
  "Estoy para ayudarte con la misión: pistas, consejos entre las dos opciones, o contarte qué sé de cada lugar. Probá con «¿Qué camino me conviene?»."
 ],
 audio: [
  "Podés escuchar la narración de cada escena con el botón «Escuchar narración», y detenerla cuando quieras con el mismo botón.",
  "Debajo del texto de cada escena está el botón para escuchar la narración. Se frena tocándolo otra vez."
 ],
 sinPistas: [
  "Ya te di todas las pistas que tengo para esta escena, Kai. Si querés, te aconsejo entre las opciones.",
  "Se me acabaron las pistas para esta escena. ¿Querés que analicemos las opciones juntos?"
 ],
 sinDecision: [
  "En esta escena no hay nada que decidir, Kai: solo queda continuar la historia.",
  "Acá no hay dos caminos: lo único pendiente es seguir adelante."
 ],
 repetido: [
  "Te lo digo de otra manera:",
  "Para que quede más claro:",
  "Otra forma de verlo:"
 ],
 fueraDeTema: [
  "Mmm, eso se me escapa, Kai. Mi especialidad es esta misión. ¿Te cuento dónde estamos o te doy una pista?",
  "No estoy segura de haberte entendido. Puedo darte una pista, contarte qué pasa o aconsejarte un camino.",
  "Esa pregunta me quedó grande. Pero si me preguntás por el virus, la ciudad o tus opciones, ahí sí te puedo ayudar.",
  "No lo capté, Kai. Probá con otra pregunta, por ejemplo: «¿Qué detectás acá?»."
 ],
 delegar: [
  "Si me pedís mi opinión, te la doy con gusto.",
  "Te cuento lo que pienso."
 ],
 fraseRecomendacion: [
  "Por lo que me decís, yo elegiría la opción «{op}», porque {porque}. Igual, la decisión es tuya, Kai.",
  "Con eso en mente, la opción «{op}» me parece buena: {porque}. Vos mandás, Kai.",
  "Entonces yo me inclinaría por la opción «{op}»: {porque}. Pero la última palabra la tenés vos.",
  "Si me preguntás, voy con «{op}»: {porque}. Pero confío en tu criterio, Kai."
 ],
 fraseDelegar: [
  "Si tuviera que elegir yo, tomaría la opción «{op}»: {porque}. Pero vos decidís, Kai.",
  "Mi consejo: la opción «{op}», porque {porque}. Ahora, ¿qué te dice tu instinto?",
  "Yo me quedaría con «{op}», porque {porque}. Igual, esto es tuyo."
 ],
 cierreOpcion: [
  "¿Te animás con esa opción o la comparamos con la otra?",
  "¿Te convence o querés que analicemos la otra?",
  "¿Qué opinás, Kai? ¿Vamos con esta o miramos la otra?"
 ],
 confirmarOpcion: [
  "Perfecto, Kai. Tocá el botón «{op}» y yo te acompaño.",
  "Hecho. Elegí «{op}» y seguimos juntos.",
  "Esa es la actitud. Presioná «{op}» cuando estés listo."
 ],
 reAsk: [
  "No me quedó claro, Kai. ¿Qué te inclina más: A) «{op1}» o B) «{op2}»?",
  "Mmm, no logré captarlo. ¿Preferís «{op1}» o «{op2}»?"
 ],
 empate: [
  "Me dijiste cosas de los dos lados, Kai. Si tuvieras que elegir una sola, ¿cuál pesa más?",
  "Ambas te tientan, ¿eh? ¿Cuál priorizás si no pudieras hacer las dos?"
 ],
 chipsBase: ["¿Qué camino me conviene?","Dame una pista","¿Qué opciones tengo?","Contame qué pasó","¿Qué detectás acá?","¿Quién sos, Vera?","¿Qué es una IA?","¿Qué es el Proyecto Morfeo?"]

}

};
