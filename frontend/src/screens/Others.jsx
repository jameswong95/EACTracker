import React from 'react';
import CostModule from './CostModule.jsx';

// Other LOB and MISC module - project-level purchase register for costs that do
// not belong to Material or Sub-Con (line-of-business / miscellaneous).
export default function Others({ projectId, navigate, role }) {
  return (
    <CostModule
      module="others"
      etcKey="others_etc"
      title="Other LOB and MISC"
      category="Other LOB and MISC"
      descPlaceholder="Description of the cost"
      projectId={projectId}
      navigate={navigate}
      role={role}
    />
  );
}
