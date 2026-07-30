"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Card, CardContent } from "@mui/material";
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";

import { useRouter } from "next/navigation";

// Draggable Customer Card
function CustomerCard({ customer, isOverlay }: { customer: any, isOverlay?: boolean }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: customer.id,
    data: customer
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isOverlay ? 999 : 1,
  } : undefined;

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      onPointerDown={(e) => {
        // Only trigger drag if it's a long press or movement, allow clicking
      }}
      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
      sx={{ 
        mb: 2, 
        cursor: 'grab',
        opacity: isOverlay ? 0.8 : 1,
        boxShadow: isOverlay ? 5 : 1,
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>{customer.name}</Typography>
          {customer.aiProfile?.interestLevel !== undefined && (
            <Typography variant="caption" sx={{ 
              bgcolor: customer.aiProfile.interestLevel >= 75 ? '#fee2e2' : customer.aiProfile.interestLevel >= 40 ? '#fef3c7' : '#e0f2fe',
              color: customer.aiProfile.interestLevel >= 75 ? '#991b1b' : customer.aiProfile.interestLevel >= 40 ? '#92400e' : '#075985',
              px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold'
            }}>
              {customer.aiProfile.interestLevel >= 75 ? '🔥 Hot' : customer.aiProfile.interestLevel >= 40 ? '🟡 Warm' : '❄️ Cold'}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>Click to view profile</Typography>
      </CardContent>
    </Card>
  );
}

// Droppable Column
function KanbanColumn({ stage }: { stage: any }) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
    data: stage
  });

  return (
    <Paper 
      ref={setNodeRef} 
      sx={{ 
        p: 2, 
        minWidth: 300, 
        bgcolor: isOver ? '#e2e8f0' : '#f0f2f5', 
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        {stage.name} <Typography component="span" color="text.secondary">({stage.customers?.length || 0})</Typography>
      </Typography>
      <Box sx={{ flexGrow: 1 }}>
        {stage.customers?.map((customer: any) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </Box>
    </Paper>
  );
}

export default function PipelinePage() {
  const [stages, setStages] = useState<any[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

  const fetchStages = async () => {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      if (res.ok) setStages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveCustomer(active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCustomer(null);

    if (!over) return;

    const customerId = active.id;
    const newStageId = over.id;

    // Optimistically update UI
    let sourceStageId: string | null = null;
    const newStages = stages.map(stage => {
      if (stage.customers.some((c: any) => c.id === customerId)) {
        sourceStageId = stage.id;
        return {
          ...stage,
          customers: stage.customers.filter((c: any) => c.id !== customerId)
        };
      }
      return stage;
    });

    if (sourceStageId === newStageId) return; // No change

    const customerToMove = stages.find(s => s.id === sourceStageId)?.customers.find((c: any) => c.id === customerId);
    
    if (customerToMove) {
      setStages(newStages.map(stage => {
        if (stage.id === newStageId) {
          return {
            ...stage,
            customers: [customerToMove, ...stage.customers]
          };
        }
        return stage;
      }));
    }

    // Persist to DB
    try {
      await fetch("/api/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, newStageId })
      });
    } catch (e) {
      console.error(e);
      fetchStages(); // revert on error
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>Sales Pipeline</Typography>
      
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} />
          ))}
        </Box>
        
        <DragOverlay>
          {activeCustomer ? <CustomerCard customer={activeCustomer} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}
