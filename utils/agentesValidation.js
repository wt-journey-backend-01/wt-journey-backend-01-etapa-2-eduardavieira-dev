const { z } = require('zod');

const agenteSchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    dataDeIncorporacao: z.coerce.date({
        required_error: 'Data de incorporação é obrigatória',
        invalid_type_error: 'Data inválida'
    }),
    cargo: z.string({ required_error: 'Cargo é obrigatório' }).min(2, { message: 'Cargo deve ter pelo menos 2 caracteres' })
});

agenteSchema.partialParse = (data) => {
    return agenteSchema.partial().parse(data);
};

module.exports = { agenteSchema };