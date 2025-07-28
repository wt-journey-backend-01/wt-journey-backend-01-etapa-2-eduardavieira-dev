const { z } = require('zod');

const casoSchema = z.object({
    titulo: z.string({ required_error: 'Título é obrigatório' })
    .min(1, { message: 'Título deve ter pelo menos 1 caractere' }),
    descricao: z.string({ required_error: 'Descrição é obrigatória' }).min(1, { message: 'Descrição deve ter pelo menos 1 caractere' }),
    status: z.enum(['aberto', 'solucionado'], 
        { required_error: 'Status é obrigatório', 
          invalid_type_error: 'O campo "status" pode ser somente "aberto" ou "solucionado"' }),
    agente_id: z.string({ required_error: 'ID do agente é obrigatório' })
    .uuid({ message: 'ID do agente deve ser um UUID válido' }),
})

// Adiciona método para validação parcial
casoSchema.partialParse = (data) => {
    return casoSchema.partial().parse(data);
};

module.exports = { casoSchema }