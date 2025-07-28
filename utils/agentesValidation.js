const { z } = require('zod');

const agenteSchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    dataDeIncorporacao: z.coerce.date({
        required_error: 'Data de incorporação é obrigatória',
        invalid_type_error: 'Data inválida'
    }).refine((date) => date <= new Date(), {
        message: 'Data de incorporação não pode ser no futuro'
    }),
    cargo: z.string({ required_error: 'Cargo é obrigatório' }).min(2, { message: 'Cargo deve ter pelo menos 2 caracteres' })
});

const formatZodError = (error) => {
    const errors = error.errors.map(err => ({
        campo: err.path.join('.'),
        mensagem: err.message
    }));
    
    return {
        erro: 'Dados inválidos',
        detalhes: errors
    };
};

module.exports = { agenteSchema, formatZodError };