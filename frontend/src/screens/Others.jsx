import React from 'react';
import CostModule from './CostModule.jsx';

// Others LOB/MISC module - project-level purchase register for costs that do
// not belong to Material or Sub-Con (line-of-business / miscellaneous).
export default function Others({ projectId, navigate, role }) {
  return (
    <CostModule
      module="others"
      etcKey="others_etc"
      title="Others LOB/MISC"
      category="Others LOB/MISC"
      descPlaceholder="Description of the cost"
      projectId={projectId}
      navigate={navigate}
      role={role}
    />
  );
}
