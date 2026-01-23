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
export const getExerciseById = async (id) => {
    const { data: exercise, error } = await supabase
        .from('exercises')
        .select('name, image')
        .eq('id', id)
        .single();

    if (error) {
        throw error;
    }

    return exercise;
};
