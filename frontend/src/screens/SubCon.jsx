import React from 'react';
import CostModule from './CostModule.jsx';

export default function SubCon({ projectId, navigate, role }) {
  return (
    <CostModule
      module="sub-con"
      etcKey="subcon_etc"
      title="Sub-Con"
      category="Subcon"
      descPlaceholder="Description of sub-contracted work"
      projectId={projectId}
      navigate={navigate}
      role={role}
    />
  );
}
