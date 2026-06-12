const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COLORS = { PRIMARY: '#6600ff' };

module.exports = {
    name: 'tutorial',
    description: 'Guia completa para nuevos jugadores',
    category: 'principal',
    cooldown: 0,
    
    data: () => new SlashCommandBuilder()
        .setName('tutorial')
        .setDescription('Guia completa para nuevos jugadores'),
    
    async execute(context) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('Tutorial - Ketil Farm')
            .setAuthor({
                name: 'Guia de Iniciacion',
                iconURL: context.client?.user?.displayAvatarURL?.() || context.user?.displayAvatarURL?.()
            })
            .setDescription('Domina las profundidades de Ketil Farm como un verdadero guerrero')
            .addFields(
                { name: 'FASE 1: Esclavo', value: 'Objetivo: Pagar 50,000 monedas de deuda\n\n1. !startv - Comienza tu aventura\n2. !clear - Desarraigar arboles (20 energia)\n3. !till - Arar tierra (15 energia)\n4. !plantwheat - Sembrar trigo (10 energia)\n5. Espera 5 minutos y !harvestwheat\n6. Repite hasta ser LIBRE', inline: false },
                { name: 'FASE 2: Libertad', value: 'Al pagar la deuda recibiras el rol Hombre Libre\nPodras viajar a nuevas regiones:\n- Vinland (costo: 1000 monedas)\n- Noruega (costo: 2500 monedas)\n- Inglaterra (costo: 5000 monedas)\n- Islandia (costo: 7500 monedas)', inline: false },
                { name: 'Sistema de Karma', value: 'KARMA ALTO (+): Explorador Pacifico\n- Explora tierras exoticas\n- Encuentra recursos raros\n- Ruta comercial segura\n\nKARMA BAJO (-): Mercenario Tirano\n- Asalta aldeas y barcos\n- Roba recursos\n- Puede usar esclavitud', inline: false },
                { name: 'Gobernante', value: 'Al fundar colonia con !settle <nombre>:\n\nComo Rey Pacifico: Crea mercados, rutas comerciales, defensas\nComo Tirano: Cobra impuestos altos, usa esclavitud, riesgo de rebeliones', inline: false }
            )
            .setFooter({ text: 'La libertad tiene un precio, ¿estaras preparado?', timestamp: new Date() });
        
        return { embeds: [embed] };
    }
};