import { supabase } from '../supabase.js';

export const getExercises = async () => {
    const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*');

    if (error) {
        throw error;
    }

    return exercises;
};
