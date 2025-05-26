import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing punishment ID' }, 
        { status: 400 }
      );
    }
    
    // Delete the punishment
    const { error } = await supabase
      .from('punishments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting punishment:', error);
      return NextResponse.json(
        { error: 'Failed to delete punishment', details: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Punishment deleted successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting punishment:', error);
    return NextResponse.json(
      { error: 'Failed to delete punishment', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 